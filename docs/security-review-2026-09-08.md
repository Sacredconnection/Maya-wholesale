# Revisao de seguranca - Maya Wholesale

Data: 2026-09-08. Escopo: codigo local das 17 rotas API, autenticacao/sessoes, autorizacao comercial, integracoes PHP fornecidas, uploads, webhooks, catalogo, respostas HTTP e dependencias npm. Nenhum teste enviou e-mails, criou contas/pedidos reais ou modificou producao. A revisao nao equivale a um pentest do WordPress hospedado.

## Falhas corrigidas

| Achado | Impacto | Correcao |
| --- | --- | --- |
| Cadastro revelava e-mail existente por texto, HTTP 409 e processamento diferente | Enumeracao de contas | HTTP 202 e corpo identico; nenhum ID/status de conta no retorno. Consulta/criacao e e-mails executados com after(), depois da resposta. |
| Recuperacao podia ter latencia diferente conforme existencia do usuario | Enumeracao por tempo | Resposta generica antes de chamar WordPress; orientacoes apenas por e-mail. |
| Login/cadastro sem limitacao compartilhada; pedidos de prazo limitados apenas em memoria | Tentativas automatizadas e abuso de e-mail | Contadores atomicos no WordPress por cliente e identificador, sem depender da instancia Next.js; falha do servico bloqueia a operacao. |
| Historico de pedidos e meios de pagamento aceitavam cookies sem revalidar aprovacao | Acesso de conta revogada ate expirar o cookie | Consulta da conta, ID, e-mail, aprovacao e versao da sessao antes de ler dados. |
| Troca de senha nao invalidava cookies do portal | Sessao antiga continuava utilizavel | Versao de sessao atualizada pelos hooks de troca/reset de senha e conferida em todas as rotas autenticadas. |
| Papel diferente de customer podia liberar conta legada sem aprovacao | Acesso indevido por subscriber/editor ou papel desconhecido | Compatibilidade limitada aos papeis legados explicitos; cadastros do portal sempre exigem metadados de aprovacao. |
| JSON null/primitivo podia provocar falhas fora da validacao | Erros 500 provocados por entrada publica | Somente objetos JSON aceitos, com leitura limitada. |
| Avatar e webhook carregavam o corpo inteiro antes do limite | Consumo excessivo de memoria com corpo chunked | Limites durante a leitura, independentes de Content-Length. |
| Avatar verificava apenas assinatura inicial do arquivo | Arquivos falsos/poliglotas, metadados indesejados | Decodificacao e reencodificacao PNG; limite de 16 MP; JPEG/PNG/WebP estaticos. |
| Proxy de imagens permitia porta arbitraria no host e leitura sem limite previo | Requisicoes indevidas a servicos no host / consumo de recursos | Origem exata, sem credenciais, sem redirecionamentos, timeout, leitura limitada e decodificacao segura. |
| Quantidade de estoque validada por linha, ignorando repeticoes | Ultrapassar estoque/limite repetindo o produto | Quantidades agregadas por loja/produto/variacao. |
| Produtos/variacoes podiam ser resolvidos sem conferir publicacao do pai | Pedido de item nao publicado | Validacao de publicacao, bloqueio de pai variavel sem formato e precos finitos vindos do servidor. |
| Ponte de recuperacao WordPress publica aceitava IP fornecido pelo cliente | Contorno dos limites pela chamada direta | Ponte exige autenticacao administrativa; portal so confia no IP sobrescrito pelo proxy configurado. |
| Seis alertas npm (incluindo tres altos) | Riscos em dependencias diretas/transitivas | Atualizacoes compativeis e override uuid 11.1.1+ restrito ao ExcelJS. Auditoria final: zero alertas conhecidos. |

## Verificacao

Resultado final: 51 testes passaram, incluindo os testes PHP; zero testes ignorados. npm audit retornou zero vulnerabilidades conhecidas.

- Testes automaticos de respostas iguais e ausencia de consulta sincrona no cadastro e recuperacao.
- Casos de cadastro pendente, rollback, duplicidade sem alterar a conta, aprovacao manual e bloqueio pela API.
- Testes de CSRF, cookies adulterados, versao de sessao, contas revogadas, JSON invalido, streams excessivos, imagens falsas, destinos/portas proibidos, limite compartilhado e falha fechada.
- Pedidos: preco informado pelo cliente ignorado, estoque agregado e produtos nao publicados bloqueados.
- PHP: sintaxe dos dois plugins e execucao de hooks com simuladores de WordPress/banco. Testes de contadores nao substituem validacao contra MySQL e WordPress reais.
- Exportacao e leitura XLSX com formatacao que exercita UUID v4 apos a atualizacao.
- Lint global e build de producao passaram. O build usou o fallback de categorias porque as credenciais WooCommerce nao estao configuradas neste ambiente.
- A listagem de arquivos de credenciais versionados retornou apenas .env.example; uma busca de padroes de chaves em 138 arquivos de texto versionados nao encontrou ocorrencias. Essa busca nao garante ausencia de todos os formatos de segredo e nao inclui todo o historico Git.

## Pontos que permanecem para acompanhamento

1. **Pedidos duplicados / concorrencia (confirmado por leitura, nao alterado nesta entrega):** a chave de idempotencia ainda e gravada como metadado e usada para recuperar respostas incertas. Nao ha reserva atomica da chave antes da criacao; reutiliza-la ou enviar requisicoes simultaneas pode gerar pedidos duplicados. A correcao exige reserva/consulta atomica no backend WooCommerce e testes de concorrencia. A verificacao agregada de estoque nesta entrega protege repeticoes dentro de uma requisicao, nao garante reserva entre compradores simultaneos.
2. **Producao nao auditada:** nao foram inspecionados plugins/temas efetivamente instalados, permissoes das chaves, XML-RPC, wp-login.php, endpoint publico de autores, WAF/CDN, backups ou logs do servidor. O login WordPress/XML-RPC precisa de protecao propria no backend; os limites do portal nao interceptam esses acessos diretos.
3. **CSP:** scripts inline continuam permitidos pelo projeto. Nonces/hashes podem endurecer essa politica, mas exigem revisar renderizacao e cache das paginas. Nao foi encontrado uso inseguro de HTML dinamico nas superficies examinadas; isso nao prova ausencia total de XSS.
4. **Trabalho apos resposta:** after() reduz o canal de tempo dependente da existencia da conta, mas nao e fila duravel. Timeout/reinicio pode interromper o processamento; e-mails e logs precisam de monitoramento e retentativas operacionais. Nao foi prometida igualdade absoluta de latencia de rede.
5. **Contas antigas:** contas ja marcadas como aprovadas indevidamente por versoes anteriores precisam de revisao administrativa. Nao se presume que todo aprovado foi aprovado incorretamente.
6. **Cabecalho IP e cron:** fora da Vercel, configurar apenas um cabecalho sobrescrito pelo proxy e impedir acesso direto ao servidor. Sem isso o sistema usa um bucket compartilhado. Manter WP-Cron ativo para a limpeza diaria dos contadores.

## Aplicacao em producao

Instalar Core 1.0.3 (sem manter Admin Tools ativo junto), confirmar WP_ADMIN_USER/WP_APP_PASSWORD administrativos, SESSION_SECRET, WooCommerce e envio de e-mail; depois publicar o portal. Validar com contas de teste: cadastro novo pendente, repeticao com resposta publica igual, aprovacao mudando pending para customer, login, recuperacao/reset, revogacao de cookie antigo e bloqueio por excesso de tentativas. Nenhuma dessas alteracoes foi publicada por esta revisao.

## Referencias

- [OWASP: mensagens de autenticacao e enumeracao](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-and-error-messages).
- [OWASP: validacao e limites de uploads](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
- [Vercel: cabecalhos de IP do cliente](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for).
- Next.js: documentacao da versao instalada em node_modules/next/dist/docs, funcoes after e configuracao maxDuration.
