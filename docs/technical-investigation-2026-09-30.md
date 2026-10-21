# Investigação técnica do Maya Wholesale

## Atualização após as correções de 30/09/2026

O diagnóstico original abaixo é um registro anterior às alterações. Estado atualizado:

- **Publicado:** dados ING no portal e nas instruções/conta BACS do WooCommerce, mantendo os valores confirmados pelo usuário. Conferência nas faturas e proformas ainda pendente.
- **Aplicado no WooCommerce:** aparência dos e-mails padrão (logo, cores e rodapé). Isso não comprova entrega SMTP.
- **Implementado localmente, sem commit ou publicação nesta etapa:** campos de produto status/type na consulta de pedidos; conversão consistente de kg para gramas; desconto da conta aplicado no servidor com cálculo e arredondamento compartilhados com o checkout; recuperação dos e-mails pendentes por customer.updated e aprovação com marcadores já aprovados; logs de rate limit com ação, categoria de falha e status HTTP, sem credenciais ou identificadores de clientes.
- O webhook registra separadamente cada envio concluído, permitindo retentar o aviso interno sem repetir a confirmação já registrada. A deduplicação em eventos simultâneos ainda depende do provedor e de sua janela de idempotência; não foi implementada fila durável.
- **Validação:** 61 testes aprovados, zero falhas e zero omitidos, usando o PHP portátil para os quatro testes de hooks; lint e build aprovados. Dez testes de regressão adicionados em tests/pdf-bugfixes.test.mjs. Leitura real da API confirmou status/type do produto 54419 e unidade kg. Nenhum pedido ou envio real foi criado.
- **Ainda pendente:** reserva atômica contra pedidos duplicados; reconciliação Core/portal; entrega SMTP; regras de VAT e cotação de frete; estoque/Brincr; Smart Bazar; PDFs e proformas; configuração dos webhooks; revisão de cadastro B2B e catálogo; homologação completa.
- A regra de desconto foi corrigida, mas a divergência de preços com/sem VAT permanece independente. A conversão de peso usa a unidade kg confirmada nesta loja e deverá acompanhar qualquer futura mudança dessa configuração.
- A publicação do conjunto local depende de reconciliar a rota de segurança exigida pelo portal com o Core ativo. O código do plugin remoto 1.1.0 não foi substituído pelo local 1.0.3.

---


Data: 30 de setembro de 2026. Referência: `Maya_Wholesale_Technical_Fix_Summary.pdf`, seis páginas, treze áreas de investigação.

O diagnóstico confirmou falhas no contrato de produtos do código local, na prevenção de pedidos duplicados, na aplicação de descontos e na consistência de pagamento, imposto e frete. Em produção, ainda existem instruções Triodos, faltam os webhooks previstos para o portal e há diferenças entre o plugin instalado e as capacidades exigidas pelo código local. A causa das notificações ausentes e da reclamação Smart Bazar permanece parcialmente aberta.

## Escopo e limites

- Leitura integral do PDF, código local, testes e documentação da versão instalada do Next.js.
- Consultas GET autenticadas ao WordPress e WooCommerce em `https://backend-wholesale.mayaherbs.com`, usando as credenciais de `.env.local` sem copiá-las para este relatório.
- Inspeção pública do portal `https://wholesale.mayaherbs.com`, incluindo renderizações desktop e mobile.
- Nenhum pedido, conta, e-mail, pagamento ou documento fiscal foi criado. Nenhum estoque, plugin, configuração fiscal, gateway ou arquivo de aplicação foi alterado. Nenhum commit foi feito.
- O repositório já tinha muitas alterações pendentes. Elas foram preservadas. **Código local não equivale automaticamente ao código publicado.**
- A senha de aplicação permite consultas REST administrativas, mas não dá acesso automático aos arquivos PHP do servidor, ao provedor SMTP, ao Brincr ou aos logs do provedor de hospedagem.

As evidências de API sem credenciais estão em `tmp/technical-investigation/backend-summary.json`, `followup-summary.json` e `shipping-logs-summary.json`. Esses arquivos são intermediários ignorados pelo Git; os fatos necessários à revisão estão registrados abaixo. Notas e datas de pedidos mantêm o horário retornado pelo WooCommerce.

## Cobertura dos treze itens do PDF

| Item | Resultado da investigação | Validação restante |
| --- | --- | --- |
| 1. Notificações | Destinatários e ativação consultados; evidência de envio varia entre pedidos | Logs SMTP, entrega nas caixas e correlação por pedido |
| 2. Checkout | Defeitos reproduzidos localmente em campos, duplicação e desconto | Pedido controlado completo |
| 3. SKU e variações | Contrato REST defeituoso confirmado; erro de conversão de peso identificado | Pedido Smart Bazar e documentos de expedição |
| 4. PDF de fatura | WP Overnight identificado; pedido 60289 e metadados consultados | PDF original e template PHP efetivamente usado |
| 5. Banco ING | Triodos confirmado no código, no JavaScript publicado e nas instruções Woo | Dados ING confirmados e substituição coordenada |
| 6. Pagamentos e proforma | Somente BACS habilitado entre os três gateways retornados | Origem da série PRO e fluxo comercial aprovado |
| 7. Estoque | Configuração, amostra e notas de baixa consultadas | Sistema mestre, integração e concorrência real |
| 8. Contas | Fluxos locais revisados; incompatibilidade de backend e webhooks ausentes | Cadastro, aprovação e recuperação com conta de teste |
| 9. VAT | Configuração e divergências identificadas, incluindo alíquotas antigas | Regras por produto/cliente e validação fiscal |
| 10. Frete | Zonas e métodos inventariados; portal não envia cotação de frete | Preços por peso e cenários NL, BE, DE e outro país UE |
| 11. Experiência | Telas públicas examinadas em desktop/mobile | Jornada autenticada e checkout completo |
| 12. Logs | Configuração e notas de pedidos examinadas; guia operacional abaixo | Conteúdo dos logs SMTP, PHP, agendador e hospedagem |
| 13. Plugins e tema | Versões e integrações principais inventariadas | PHP remoto, snippets, templates e overrides de hooks |

## P0 Campos de produto bloqueiam pedidos no estado local

**Problema e localização.** `src/lib/woocommerce.js:347` define `ORDER_PRODUCT_FIELDS` sem `status` e `type`. As consultas por ID e SKU usam essa projeção. `src/app/api/orders/route.js:352` exige que o pai de uma variação tenha `status === "publish"`; o caminho por SKU também exige publicação em `:373`.

**Reprodução e evidência.** O produto real 54419 retorna HTTP 200 sem esses campos quando consultado com a projeção usada pelo código. Uma consulta incluindo os campos retorna `status: publish` e `type: variable`. Na execução isolada do handler com dependências simuladas e a resposta projetada, pedidos por variação e por SKU retornaram HTTP 409 e nenhuma chamada de criação.

**Esperado e observado.** Uma variação publicada deveria passar pela validação. O código interpreta a ausência do campo como indisponibilidade. O caminho de produto simples também perde a informação necessária para reconhecer um pai variável.

**Causa.** Confirmada: o consumidor exige campos que o cliente REST remove. A nova validação de publicação está nas alterações locais preexistentes; este diagnóstico não demonstra que a mesma regressão está implantada.

**Correção proposta.** Incluir `status` e `type` e revisar todos os campos exigidos pela validação. Preservar a verificação de publicação. Testar a resposta com a mesma projeção utilizada na API real.

**Risco e rollback.** Mudança localizada no contrato de leitura. Reverter a mudança de código se necessário, sem retirar controles de publicação. **Reteste:** pendente após correção; cobrir simples, variação, pai rascunho e tentativa de comprar diretamente um pai variável.

## P0 Código local e plugin publicado exigem reconciliação

**Problema e localização.** `src/lib/auth-rate-limit.js:22` exige `POST /wp-json/maya-wholesale/v1/security/rate-limit`. O índice REST público e o autenticado só listaram duas rotas Maya, de recuperação de senha. GET na rota de rate limit retornou `404 rest_no_route`; não foi enviado POST.

**Evidência.** Core publicado: **1.1.0**. Core local: **1.0.3**, com registro da rota em `integrations/wordpress/maya-wholesale-core/maya-wholesale-core.php:787`. O número de versão maior não comprova que a versão publicada contém essa capacidade.

**Esperado e observado.** O código local precisa do serviço de rate limit antes de login, cadastro, recuperação/reset de senha, criação de pedidos, upload de avatar e solicitação de prazo. Falhas do serviço resultam em 503, conforme `auth-rate-limit.js:28` e `:36`. Portanto, este código é incompatível com as rotas observadas no backend. A revisão da versão efetivamente implantada no portal ainda é necessária para atribuir o efeito ao site ao vivo.

**Configuração local adicional.** `.env.local` contém WooCommerce e as duas variáveis WordPress, mas não `SESSION_SECRET` nem as variáveis Resend. Isso impede uma validação autenticada local completa e envio pelo canal Resend. Não permite concluir que essas variáveis faltam no Vercel.

**Correção proposta.** Comparar o conteúdo do Core 1.1.0 instalado com o código local, integrar as capacidades necessárias em uma versão única e testar compatibilidade. Não instalar o ZIP 1.0.3 sobre 1.1.0 apenas pelo nome.

**Risco e rollback.** Substituir o plugin sem comparar os arquivos pode perder correções publicadas. Guardar cópia exata do plugin ativo e das configurações antes de uma futura implantação. **Reteste:** pendente; conferir rotas, autenticação administrativa, limites e todos os fluxos consumidores.

## P0 A mesma chave pode criar dois pedidos

**Localização.** `src/app/api/orders/route.js:510`, `:539` e `:583`.

**Reprodução e evidência.** Duas chamadas isoladas ao handler com o mesmo `Idempotency-Key` retornaram 201 e 201, com duas chamadas a `createOrder` e nenhuma busca prévia por pedido. Foram usadas dependências simuladas; nenhum pedido real foi criado.

**Esperado e observado.** Repetir a mesma operação deveria devolver o pedido existente. A chave é gravada como `sc_request_reference`, mas a reconciliação só ocorre depois de uma exceção da criação. Não impede duas criações bem-sucedidas.

**Causa e correção proposta.** Falta reserva persistente e atômica da chave no backend, vinculada ao cliente e ao conteúdo do pedido. A interface bloquear o botão não protege contra resposta perdida, repetição de rede ou outra aba. Uma consulta prévia sem exclusão mútua também não resolve concorrência.

**Risco e rollback.** A mudança afeta a criação de pedidos; implementar e exercitar primeiro em ambiente de teste. Preservar registros já usados ao reverter a implementação. **Reteste:** pendente; repetir requisições simultâneas e simular perda da resposta depois da criação. Esperado: um único pedido e uma única baixa de estoque.

## P0 Notificações ainda não têm entrega comprovada

**Localização.** WooCommerce → Settings → Emails; notas dos pedidos 60606 e 60603; WP Mail SMTP.

| Mensagem | Estado consultado | Destinatário interno |
| --- | --- | --- |
| New order | Habilitada | `sales@mayaherbs.com` |
| Cancelled order | Habilitada | `sales@mayaherbs.com` |
| Failed order | Desabilitada | `info@Mayaherbs.com` configurado |
| Customer on-hold | Habilitada | Cliente do pedido |
| Customer processing | Habilitada | Cliente do pedido |
| Customer completed | Habilitada | Cliente do pedido |

Remetente Woo: Maya Ethnobotanicals, `info@mayaherbs.com`. WP Mail SMTP 4.6.0 está ativo.

**Evidência e reprodução.** GET das configurações acima e das notas de pedidos preexistentes:

- **60606**, criado por REST em 30/09: há notas `Email "New order" sent.` e `Email "Order on-hold" sent.`, além da transição para on-hold.
- **60603**, criado por REST em 28/09: há nota de envio on-hold e baixa de estoque; a resposta consultada não contém nota equivalente de New order.

**Esperado e observado.** Deve existir confirmação verificável de aviso interno e ao cliente para cada pedido. Há evidência de envio pelo Woo em um caso e trilha incompleta em outro. Ausência da nota não prova ausência do envio; presença da nota não prova recebimento na caixa. Essa distinção também consta da [documentação de diagnóstico de e-mail do WooCommerce](https://woocommerce.com/document/email-faq/).

**Causa.** Ainda não determinada. “New order está desligado” não explica a configuração atual. Podem existir diferenças históricas de configuração, hooks, falha de disparo ou falha de entrega; essas hipóteses precisam de logs. O canal Resend do repositório cobre cadastro/aprovação/prazo, e não notificações de pedidos.

**DNS observado.** SPF existe e inclui Dropper, Mailjet e Google; DMARC existe com `p=none`; MX aponta ao Google. Isso não identifica qual transporte o WordPress usou nem comprova SPF/DKIM/alinhamento de uma mensagem. DKIM exige o seletor do provedor efetivamente utilizado.

**Correção proposta.** Correlacionar pedido, evento Woo e mensagem no SMTP, identificar rejeições/supressões e decidir o destinatário de pedidos falhos. Depois executar um pedido controlado e confirmar ambas as caixas.

**Risco e rollback.** Reenvios podem gerar duplicidade de comunicação; não reenviar pedidos históricos em lote. Registrar configuração anterior e IDs de mensagens. **Reteste:** pendente; o marco de entrega completa do PDF não foi cumprido nesta investigação de leitura.

## P1 Pagamento ainda aponta para Triodos

**Localização e evidência.** `src/lib/payment-methods.js:9` e `:10`, configurações REST do gateway BACS e JavaScript publicado carregado por `/checkout` (`/_next/static/immutable/chunks/0lg1n16rcbips.js`, HTTP 200) contêm os dados Triodos. O IBAN não é reproduzido neste relatório.

**Reprodução.** Abrir a configuração de BACS e consultar a constante de pagamento. A constante alimenta checkout, confirmação, nota do cliente e metadados do novo pedido (`orders/route.js:550` e `:560`). Mudar apenas o WooCommerce deixa instruções antigas no portal.

**Esperado e observado.** O relatório solicita ING confirmado; o sistema ainda apresenta Triodos. Causa confirmada em duas fontes independentes de configuração. A presença em todas as faturas/e-mails históricos não foi verificada.

**Correção proposta.** Confirmar titular, IBAN, BIC e instruções ING; centralizar a configuração e atualizar as superfícies atuais de forma coordenada. Tratar documentos históricos separadamente.

**Risco e rollback.** Dados errados direcionam pagamentos incorretamente. Guardar configurações anteriores e validar com o responsável financeiro antes da publicação. **Reteste:** pendente; checkout, confirmação, conta, pedido, e-mails, proforma e PDF.

## P1 Descontos e impostos podem divergir do valor apresentado

### Desconto do cliente

**Localização e reprodução.** `checkout/page.js:452` calcula subtotal menos `user.discountRate`; `orders/route.js:521` envia linhas sem aplicar esse desconto. Na simulação de cliente com 10% e duas unidades de €12,50, o checkout calcula **€22,50**, mas o payload Woo contém **€25,00**. A taxa aparece apenas em metadados do pedido.

**Causa.** Confirmada no código local: UI e servidor usam cálculos diferentes. O efeito depende de existir cliente com desconto não zero; não foi feito censo de contas.

**Correção proposta.** Calcular desconto no servidor a partir da conta atual e apresentar a mesma cotação na revisão do checkout. **Risco/rollback:** revisar a combinação com preços por papel e quantidade; reverter conjuntamente UI e cálculo. **Reteste:** pendente, incluindo 0%, desconto válido e interação com tabelas de preço.

### VAT e total da compra

**Configuração ao vivo.** Preços cadastrados incluem imposto; loja/carrinho Woo exibem imposto incluído; cálculo pelo país de entrega; imposto do frete herda a classe. Foram retornadas 58 regras fiscais.

**Evidência.** A variação 60120, SKU `4709-5`, tem preço cadastrado **€19,90**. O pedido preexistente 60606 registra linha **€19,90**, imposto **€4,18** e total **€24,08**, com país NL. O checkout local calcula subtotal menos desconto e não discrimina VAT; o servidor envia o preço como total líquido da linha. Isso demonstra uma divergência a reconciliar; a decisão sobre preço comercial líquido/bruto ainda precisa ser confirmada antes de recalcular valores.

O JavaScript público carregado por `/checkout` também calcula “Estimated total” como subtotal menos desconto e mostra o frete como “Calculated later”. Esse cálculo foi confirmado por leitura do asset publicado; não foi submetido um checkout autenticado.

**Outras lacunas locais.** VAT é texto obrigatório no cadastro, sem validação VIES identificada. O mapeamento do usuário e o payload local de pedido não transportam explicitamente o número VAT e a decisão de isenção. Hooks remotos podem complementar esse comportamento e não foram inspecionados.

**Alíquotas cadastradas desatualizadas.** As regras de classe `standard` incluem valores diferentes das alíquotas gerais publicadas pelas autoridades:

| País | Regra Woo consultada | Alíquota geral publicada |
| --- | --- | --- |
| Estônia | 20% | 24% desde 01/07/2025, [EMTA](https://www.emta.ee/en/business-client/taxes-and-payment/value-added-tax) |
| Finlândia | 24% | 25,5% desde 01/09/2024, [Vero](https://www.vero.fi/en/businesses-and-corporations/taxes-and-charges/vat/rates-of-vat/) |
| Eslováquia | 20% | 23% desde 01/01/2025, [Finančná správa](https://www.financnasprava.sk/sk/pre-media/novinky/archiv-noviniek/detail-novinky/_konsolidacia-dph-ts/bc) |
| Romênia | 19% | 21% desde 01/08/2025, [ANAF](https://static.anaf.ro/static/3/Cluj/20250912115924_cj_cotele_reduse_tva_12sep2025.pdf) |

Essa comparação identifica regras antigas; não determina que a alíquota geral se aplique a todo produto ou comprador. Classes reduzidas, data da operação, localização e elegibilidade de operações B2B precisam de revisão fiscal própria.

**Correção proposta.** Definir a origem do preço líquido/bruto e da decisão fiscal, obter cotação autoritativa antes do envio e revisar as regras com o responsável fiscal. **Risco/rollback:** salvar regras e amostras anteriores; não recalcular documentos históricos automaticamente. **Reteste:** pendente para NL, empresa UE elegível, cliente UE sem isenção e países de cobrança/entrega diferentes.

## P1 Frete configurado no Woo não é cotado pelo portal

**Localização.** `checkout/page.js:967` mostra “Calculated later”. O payload em `orders/route.js:540` não inclui método ou `shipping_lines`. Os cinco pedidos REST recentes consultados tinham frete zero e nenhuma linha de frete.

| Zona consultada | Métodos ativos |
| --- | --- |
| NL, zona 4 | Weight Based Shipping, frete grátis a partir de €100 e retirada em Haarlem |
| BE, DE, FR e outros, zona 8 | Weight Based Shipping e frete grátis a partir de €100 |
| IT, IE, MT e outros, zona 9 | Weight Based Shipping e frete grátis a partir de €100 |
| GB e CH, zona 6 | Weight Based Shipping e frete grátis a partir de €100 |
| Fora da Europa, zona 7 | Weight Based Shipping; frete grátis desativado |
| Restante, zona 0 | Weight Based Shipping |

**Reprodução e causa.** Comparar GET das zonas/métodos com o payload da rota de pedidos. As zonas existem, mas não são usadas para cotação no código local. As tarifas internas do plugin WBS não foram expostas nesse retorno (`settings: []`), portanto os custos por peso permanecem não verificados.

**Outra ambiguidade.** Portugal aparece nas zonas 8 e 9. Woo usa a primeira zona correspondente; o nome “up to/over 20 EUR” não cria uma condição por valor. Conferir intenção e ordem. [Documentação de zonas](https://woocommerce.com/document/setting-up-shipping-zones/).

**Esperado e observado.** O PDF pede consistência entre checkout e fatura; atualmente o portal anuncia cálculo posterior. É preciso decidir se esse é um pedido para cotação manual ou uma compra com total final.

**Correção proposta.** Integrar cotação e seleção reais ou formalizar o fluxo de orçamento e comunicar claramente quando o total será confirmado. Revisar países atendidos, mínimos e zonas sobrepostas. **Risco/rollback:** exportar configuração e comparar cotações antes de publicar; não alterar tarifas sem validação comercial. **Reteste:** pendente para NL/BE/DE/FR, pedidos leves, pesados e mistos, com imposto do frete.

## P1 Integridade de produtos e estoque

### Peso pode mudar de unidade ao chegar a cinco

**Localização e reprodução.** `src/lib/wc-mappers.js:83` usa a heurística “menor que 5 é kg; a partir de 5 é gramas”. Sem peso reconhecível no nome, campo `weight` igual a `4` vira 4.000 g, `5` vira 5 g e `10` vira 10 g. O Woo está configurado em **kg**.

**Causa e efeito.** Conversão local confirmadamente inconsistente com a unidade da loja. A manifestação depende de produtos que usem o campo em vez de um peso reconhecido no nome. Pode afetar exibição e faixa de preço. A amostra de 100 produtos publicados em inglês, de 411 retornados no total, tinha 90 campos de peso vazios; isso não significa 90 embalagens sem tamanho, pois o nome/atributo pode fornecê-lo.

**Correção proposta.** Converter pela unidade configurada e manter volume, peso e unidades como grandezas diferentes. **Risco/rollback:** validar preços dependentes do peso antes da publicação e manter amostras anteriores. **Reteste:** pendente para 4/5/10 kg, formatos em gramas e opções em ml.

### Sistema mestre e concorrência de estoque

**Evidência ao vivo.** Gestão de estoque habilitada, retenção de estoque por 300 minutos, WP-Cron ativo. O pedido 60289 registra reserva e baixa no fluxo Woo clássico; o 60603 registra baixa ao passar para on-hold. Isso comprova movimentação em exemplos, sem validar cancelamento/restauração ou a integração completa.

**Código local.** Há leitura atual e validação agregada de quantidades do mesmo produto/variação. Não há reserva atômica no portal; leitura e criação são separadas. A projeção não inclui `manage_stock`/`backorders`, e o código não agrega estoque compartilhado entre variações do mesmo pai.

**Causa ainda aberta.** Nenhum plugin com nome Brincr nem integração Brincr foi identificado no repositório. Os cinco webhooks Woo retornados apontam ao Klaviyo. Isso não exclui polling por API ou integração externa. O sistema mestre continua indeterminado.

**Correção proposta.** Identificar origem do estoque, periodicidade, responsável e mapeamento SKU; avaliar reserva no Woo e política de backorders. **Risco/rollback:** não mudar estoque real para testar; exercitar sincronização e restauração em staging. **Reteste:** pendente para duas compras concorrentes, cancelamento e falha de integração.

### Smart Bazar e pedido 60289

A consulta de pedidos com busca “Smart Bazar” retornou zero correspondências. Falta o número exato do pedido ou referência downstream. Não foi confirmada causa no frontend.

O pedido **60289 existe**, foi criado em **11/08/2026** via `checkout`, antes da data aproximada de lançamento descrita no PDF. Está on-hold, tem 12 linhas, total €895,00 e VAT €136,54. As notas mostram inclusão de linhas e ajustes de estoque em 30/09. Comparar apenas suas linhas atuais com o pedido original não permite atribuir mudanças à interface: houve alterações posteriores registradas.

## P1 Fatura PDF e proformas precisam dos artefatos originais

**Localização e evidência.** Está ativo **PDF Invoices & Packing Slips for WooCommerce 4.7.0**, da WP Overnight. O pedido 60289 contém metadados `_wcpdf_*`, incluindo número de documento `175` e gatilho `single`. Portanto, 60289 identifica o pedido nesta API; não se deve assumir que também é o número fiscal impresso.

**Esperado e observado.** O relatório descreve sobreposição de linhas e totais mal organizados, mas não incorpora a fatura original. Nenhum PDF novo foi gerado, pois a geração pode gravar número/data fiscal. A colisão visual permanece relatada, não reproduzida nesta investigação.

**Causa.** O gerador foi identificado; o template efetivo e suas customizações remotas não. Os metadados disponíveis não bastam para atribuir a causa ao template padrão.

**Proformas.** Não foi localizada geração PRO no código local ou uma extensão WP Overnight Professional no inventário. A documentação associa proformas à extensão Professional, mas isso não identifica o gerador usado pela Maya: pode existir um processo externo/manual. [Documentação de tipos de documento](https://docs.wpovernight.com/woocommerce-pdf-invoices-packing-slips/more-document-types/).

**Correção proposta.** Obter o PDF original de 60289, um documento PRO e os templates efetivos; redesenhar colunas e quebras com nomes longos, totais juntos e dados bancários confirmados. **Risco/rollback:** manter cópia dos templates, sequência fiscal e documentos emitidos; não renumerar faturas existentes. **Reteste:** pendente com PDF curto, longo e várias páginas, incluindo inspeção visual.

## P1 Métodos de pagamento e sequência operacional

**Inventário confirmado.** A API retornou BACS habilitado, cheque desabilitado e dinheiro na entrega desabilitado. Bunq não aparece entre esses gateways. No código, `BUNQ_CARD_PAYMENT_VISIBLE = false` em `checkout/page.js:44`, embora haja caminhos de servidor preparados para cartão.

**Comportamento local.** BACS cria pedido on-hold e não pago; cartão criaria pending e não pago. O flag de cartão também impede a consulta de disponibilidade de métodos pela interface. O portal usa dados bancários locais fixos.

**Esperado e observado.** Há transferência como opção efetiva; a numeração PRO e o momento de liberação para expedição não foram determinados. Não foi alterada a combinação de métodos.

**Correção proposta.** Confirmar com o responsável comercial a sequência pedido → aviso interno → instrução/proforma → pagamento conciliado → expedição, incluindo quem muda o status. **Risco/rollback:** registrar configuração anterior e validar um método por vez; preservar pedidos em aberto. **Reteste:** pendente para status, instruções e mensagens de cada método que permanecer habilitado.

## P1 Aprovação e e-mails de contas têm lacunas de recuperação

**Evidência ao vivo.** Existem somente cinco webhooks Woo, todos ativos para Klaviyo: `product.created`, `product.updated`, `product.deleted`, `order.created`, `order.updated`. Nenhum aponta para `/api/webhooks/woocommerce` do portal; nenhum trata clientes ou ação de aprovação.

**Esperado e observado.** O README prevê webhooks de produto, cliente e aprovação. Sem eles, não há invalidação imediata do cache por esse mecanismo nem o envio de aprovação por esse caminho. A atualização normal do cache pode continuar pelo TTL; outros hooks remotos não foram examinados.

**Defeito local adicional.** `src/app/api/webhooks/woocommerce/route.js:51` só retenta e-mails de cadastro no ramo `customer.created`. `customer.updated` pendente retorna sem retentar; o teste de marcador pendente após exigir aprovação também não oferece o caminho prometido no README. Logo instalar webhooks não resolve sozinho essa lógica.

**Processamento.** Cadastro usa `after()` e pode responder 202 antes de a criação/envio terminar. Erros de e-mail são registrados, sem fila durável local. O resultado do provedor não é persistido com seu ID de mensagem. Os metadados de envio não provam entrega.

**Cadastro B2B.** Tela e handler exigem VAT e estado/província para todos os países; o formulário não coleta razão social/empresa. Isso limita a informação disponível para aprovação e exige esclarecer a política de clientes sem número VAT elegível. Não foi testada a alteração de papéis de uma conta real.

**Correção proposta.** Reconciliar plugin/portal, configurar eventos corretos e idempotentes, corrigir retentativas e definir campos por país e política B2B. **Risco/rollback:** eventos repetidos podem duplicar mensagens; preservar chaves/metadados e desativar somente webhooks novos ao reverter. **Reteste:** pendente para novo cadastro, aprovação, login, reset, bloqueio/revogação, endereços e recompra.

## P2 Experiência pública e telas protegidas

A inspeção em navegador com resoluções **1440 × 1000** e **390 × 844** cobriu oito rotas públicas. Não foram detectados erros JavaScript, imagens quebradas ou transbordamento horizontal nessas verificações. O retorno 401 de `/api/auth/session` correspondia à sessão anônima; isoladamente não indica defeito.

Rotas examinadas: `/`, `/catalog`, `/digital-catalog`, `/register`, `/contact`, `/about`, `/shipping-and-returns-policy` e `/privacy-policy`; todas retornaram HTTP 200. Menu mobile e modal de login abriram corretamente. Registros e capturas estão em `tmp/pdfs/report-review/public-ux/inspection.json` e no mesmo diretório.

**Inconsistência confirmada.** O catálogo comum pede aprovação para mostrar produtos, mas o Digital Catalog público abre 411 produtos sem preços. A mensagem de acesso precisa descrever com precisão o que fica público e o que exige aprovação. Isso é uma questão de comunicação/política; não foi identificado vazamento de preços autenticados nessa observação.

**Correção proposta.** Ajustar a mensagem após confirmar a política do catálogo e rever os campos B2B descritos acima. **Risco/rollback:** baixo para texto; preservar a política de acesso ao alterar a mensagem. **Reteste:** pendente após ajuste, nos mesmos tamanhos de tela.

**Taxonomia fragmentada.** Em Digital Catalog → Ethnobotanicals, “Dream Herbs” retorna 12 produtos e “Dreamherbs” retorna outros três. A seleção na interface e os GETs de `/api/catalog` confirmaram a divisão. A segunda grafia inclui Mexican Dreamherb, Purple Passion Flower e Uvuma Omhlope. A causa confirmada é a existência de categorias distintas; a intenção comercial ainda precisa ser validada. Proposta: consolidar nomes/mapeamentos se representam a mesma categoria, preservando referências e redirecionamentos. Guardar exportação das categorias para rollback e retestar busca/filtros após qualquer mudança. Também existem opções “Tea” e “Teas”, sem comparação dos seus conjuntos nesta revisão.

A jornada autenticada, filtros com preços, checkout, pagamento, confirmação e recompra não foram homologados. Os resultados públicos não equivalem a uma auditoria completa de acessibilidade, desempenho ou jornada de compra.

## P2 Inventário técnico e observabilidade

| Componente | Versão ou estado consultado |
| --- | --- |
| WordPress | 7.1.2 |
| WooCommerce | 11.0.1 |
| PHP | 8.1.34 |
| Tema | Shoptimizer Child Theme 1.0.35; pai Shoptimizer 2.8.13 |
| Maya Wholesale Core | 1.1.0 ativo; fonte local declara 1.0.3 |
| CheckoutWC | 10.3.3 ativo |
| WP Mail SMTP | 4.6.0 ativo |
| WP Overnight PDF | 4.7.0 ativo |
| Weight Based Shipping | 6.9.1 ativo |
| Custom Payment Gateway Restrictions | 1.1 ativo |
| WooCommerce Stock Location | 1.2 ativo |
| WPCode Lite | 2.3.6 ativo |
| Polylang | Pro 3.7.3; WooCommerce 2.1.4 |
| Cache | LiteSpeed 7.5.0.1 e object cache ativos |
| Backup | BlogVault 6.76 ativo; restauração não testada |
| Next local | 16.3.0; React 19.2.7 |

O relatório Woo não marcou templates desatualizados, mas listou override de mini-cart do PRO Elements. Isso não comprova compatibilidade de todo o código. O inventário também identificou o mu-plugin do Index WP MySQL for Speed. Os conteúdos de `functions.php`, child theme, WPCode, plugins customizados e templates de fatura não estão disponíveis por essas consultas REST; a auditoria de hooks remotos continua pendente.

**Logs.** Woo informa logging ativo, retenção de 30 dias e cerca de 8 MB em arquivos. WP-Cron está habilitado; isso não comprova execução pontual dos jobs. O endpoint de status não retornou contagem/falhas do Action Scheduler. A presença de plugin SMTP também não comprova acesso a logs de entrega.

**Defeito local de diagnóstico.** `auth-rate-limit.js:36` registra uma mensagem genérica, descartando causa e ação. Erros 401, 404, timeout e configuração ausente ficam difíceis de diferenciar. Cadastro também reduz algumas falhas a `upstream_failure`.

**Correção proposta.** Registrar ação, ID de correlação, status upstream e classificação da falha, preservando segredos e dados pessoais. Persistir o ID da mensagem e eventos de entrega/falha quando houver esse canal. **Risco/rollback:** logs excessivos podem expor dados; usar campos permitidos e reverter apenas a instrumentação, sem apagar o histórico existente. **Reteste:** pendente com falhas controladas em staging.

### Onde a equipe pode verificar falhas

| Problema | Local para investigar | Evidência a guardar |
| --- | --- | --- |
| Pedido sem aviso | WooCommerce → Orders → pedido → notas; Status → Logs; WP Mail SMTP/provedor | Pedido, hora, tipo de e-mail, destinatário e ID da mensagem |
| Tarefa parada | WooCommerce → Status → Scheduled Actions; cron do host | Hook, estado, horário e mensagem da falha |
| Catálogo/aprovação sem atualização | Settings → Advanced → Webhooks; logs de runtime do portal | Tópico, URL, tentativa, status HTTP e correlação |
| Login/cadastro com erro | Logs do portal e WordPress/PHP | Etapa, status upstream e versão do plugin |
| Pagamento sem conciliação | Pedido, método e processo/provedor de pagamento | Referência do pedido e estado da conciliação |
| Estoque divergente | Notas Woo e sistema mestre a identificar | SKU, variation ID, quantidades anterior/posterior e hora |

O acesso a esses destinos e seus dados deve ser conferido antes de tratá-los como cobertura operacional completa. Não enviar tokens, senhas ou dados de compradores em capturas de diagnóstico.

## Testes executados

- `npm test`: **51 testes, 47 aprovados, 4 omitidos, zero falhas**.
- `npm run lint`: concluído sem erros ou avisos.
- Os quatro omitidos executariam hooks PHP dos dois plugins, nos contextos WordPress e REST. PHP não foi encontrado no ambiente de testes; verificações estáticas não substituem esses testes.
- Simulações adicionais do handler reproduziram rejeição por campos ausentes, duplicação com mesma chave e desconto não aplicado. Conversão de peso também foi exercitada em memória.
- Reprodução disponível: `node tmp/technical-investigation/reproduce-checkout.mjs`. O script usa dependências simuladas, sem rede ou credenciais, e não cria pedidos reais.
- Os mocks atuais fornecem `status/type` completos e ocultam o defeito da projeção REST. Testes aprovados não comprovam contrato com Woo real, envio de e-mail, tributação, frete ou pedido completo.
- Build e implantação não foram realizados; não houve alteração da aplicação para validar nesta investigação.

## Ordem recomendada de correção e reteste

1. Corrigir o contrato REST e a duplicação, reconciliar Core e portal e introduzir uma cotação autoritativa de valores. Fazer regressões locais e integração em staging.
2. Correlacionar os e-mails dos pedidos 60603 e 60606 com os logs do provedor. Preservar evidências antes do prazo de retenção.
3. Confirmar ING, política de frete, tratamento fiscal e processo PRO; preparar alterações revisáveis nas respectivas fontes de configuração.
4. Obter pedido Smart Bazar, documentos downstream, PDF original de 60289 e templates remotos. Rastrear diferenças por SKU/variação e por histórico de alteração.
5. Executar o marco controlado do PDF quando ambiente, conta, produtos, destinatários e efeito sobre estoque estiverem definidos.

### Critério de aprovação do pedido controlado

Usar conta de teste aprovada, produto simples e duas variações com tamanhos próximos; registrar SKU, IDs, quantidade, embalagem, preço, desconto, VAT e frete antes do envio. Conferir os mesmos valores no Woo, no e-mail, na proforma/fatura e no sistema de expedição. Verificar que repetir a requisição não cria novo pedido. Confirmar o recebimento interno e pelo cliente e documentar o encerramento/cancelamento de teste e restauração de estoque, conforme o ambiente escolhido.

**Estado final:** diagnóstico concluído dentro do acesso de leitura disponível. Correções, implantação e homologação integral permanecem por executar. O fluxo central não foi declarado estável.
