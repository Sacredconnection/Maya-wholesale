# Correções do site — 5 de outubro de 2026

Referência: `Maya_Herbs_Correcoes_Site_PT.pdf` (quatro páginas). Alterações locais, sem commit e sem publicação. As alterações anteriores do projeto foram preservadas.

## Implementação

- Navegação pública com Client Login e Register Account; Contact permanece no rodapé. Uma chamada principal de cadastro e um bloco informativo sobre PDFs personalizados.
- Área autenticada com Cart e Log out; logo volta ao topo sem trocar de página, filtros ou sessão. Create Catalog tem um único acesso abaixo do cabeçalho do catálogo de pedidos.
- Catálogo de pedidos com apresentação das ferramentas, linhas em largura total e opções de 10, 20, 50 e 100 produtos. Consulta pública mantida em `/catalog`; criar PDF exige autenticação em `/digital-catalog` e no endpoint de exportação.
- Categorias Hapé derivadas da hierarquia confirmada no WooCommerce: Tribal → Indigenous Hapé; Shamanic Snuff → Sacred Snuff Hapé; Tobacco Free → Tobacco-free Hapé; Rapéh Tools → Accessories; Ashes. Ordem compartilhada entre site, PDF e Excel. A categoria Shamanic de Ethnobotanicals não é renomeada. Sacred Snuff é identificada como marca própria.
- Create Catalog seleciona produtos individuais e categorias completas, preservando seleção ao pesquisar/paginar. Nenhuma seleção gera o catálogo completo. Formatos detalhado e compacto, agrupados por categoria/subcategoria, com tamanhos e faixa de preços; sem controles de pedido nessa página.
- Excel com abas por categoria, cabeçalhos/instruções em inglês, descrições da origem inglesa do catálogo e moeda EUR. Importação percorre todas as abas e aceita planilhas anteriores com `Quantidade`. Consulta variantes e preços atuais antes de exportar/importar; falha explicitamente se um item já não estiver disponível.
- My Shelf explica o ícone de marcador, onde usá-lo e como acessar a coleção.
- Fotos usam enquadramento uniforme sem corte; a seleção de variante atualiza a imagem quando a origem tem foto específica. Não foram inventadas fotos, variantes ou preços.
- Checkout oferece Save these details for next time, grava na conta autenticada e preenche próximos pedidos, inclusive cobrança separada. Mantém e-mail, telefone e outros campos da conta.
- Pagamento após fatura, sem conta bancária no portal nem nos novos metadados de pedido. O servidor bloqueia pagamento direto em novos pedidos. Confirmação e template de e-mail compartilham o texto solicitado.
- Extensão WordPress adicional com autenticação REST privada, compatibilidade com Core sem a rota de rate limit e template HTML/texto para confirmação de novos pedidos do portal. Não substitui o Core existente nem altera confirmações de varejo ou pedidos históricos.

## Dependências de publicação e confirmação

1. Instalar/ativar `maya-wholesale-site-corrections-v1.0.0.zip` junto ao Core existente e publicar o portal de forma coordenada. Gerar o pacote com `scripts/build-site-corrections-plugin.ps1`. O backend consultado expôs somente `/password/forgot` e `/password/reset`; faltam `/auth/verify` e `/security/rate-limit`.
2. Confirmar `SESSION_SECRET` forte no ambiente publicado e credenciais WordPress de aplicação. A configuração local consultada não contém `SESSION_SECRET`; nenhum segredo foi impresso ou modificado. As permissões atuais requerem `manage_options` para a ponte privada.
3. Homologar login, envio/recebimento do link de recuperação, definição da senha, pedido controlado e recebimento das confirmações. Os testes locais não comprovam entrega SMTP. Nenhuma conta, senha ou pedido real foi alterado; nenhum e-mail real foi enviado.
4. Receber a tabela atacadista aprovada e a revisão de Brinker. Agua Floresta: os cinco cadastros retornados na consulta têm uma variante cada. Nenhum tamanho adicional ou preço foi criado. A busca por SKU exato `1500` retornou zero produtos; identificar o registro correto antes de alterar preço, nome ou retirada de estoque. O valor aproximado de EUR 16 no PDF não foi tratado como preço aprovado.
5. Integração com estoque confiável permanece melhoria futura, conforme o PDF. A revisão manual de disponibilidade/frete e faturamento continua ativa.

Atualização de 06/10/2026: conforme orientação do usuário, o acesso à página do catálogo exige autenticação. Os links para /catalog abrem automaticamente o formulário de login para visitantes; fechar o formulário mantém a tela de acesso restrito. Fluxo verificado no navegador.

## Processo de atualização de dados

WooCommerce permanece a origem dos produtos, variantes e preços por perfil. Manter o catálogo de origem em inglês (`lang=en`); publicar preços aprovados por variante; invalidar o cache pelo webhook existente. PDF e Excel consultam o catálogo completo atual e os cálculos compartilhados de preço. A importação ignora preços da planilha e usa os valores atuais; o servidor revalida preços, perfil e disponibilidade ao receber o pedido. Descontos de conta e volume podem alterar o total do carrinho conforme quantidades. Frete e impostos finais são confirmados na fatura.

Referência técnica dos hooks de pagamento: https://woocommerce.github.io/code-reference/files/woocommerce-includes-gateways-bacs-class-wc-gateway-bacs.html. O template específico evita hooks que inserem automaticamente instruções BACS antes do resumo.

## Validação local

- 69 testes aprovados, incluindo testes PHP dos hooks, importação/exportação Excel, autenticação REST, endereço de conta e confirmação HTML/texto.
- Lint e build de produção aprovados.
- Jornada de navegador com dados simulados: navegação pública, consulta de produtos, paginação, seleção para PDF, importação de Excel e checkout; desktop e celular, sem erros de JavaScript.
- Amostras dos dois PDFs renderizadas e revisadas visualmente, incluindo uma descrição extensa com continuação de página.
- A homologação não enviou pedidos nem e-mails reais.
