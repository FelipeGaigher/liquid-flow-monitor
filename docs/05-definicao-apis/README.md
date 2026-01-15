# Definicao de APIs

Contratos e especificacoes de APIs do sistema.

## Subdiretorios

| Diretorio | Tipo | Descricao |
|-----------|------|-----------|
| [REST](./REST/) | REST APIs | Especificacoes OpenAPI/Swagger |
| [gRPC](./gRPC/) | gRPC | Definicoes Protobuf |
| [WEBHOOKS](./WEBHOOKS/) | Webhooks | Contratos de webhooks |
| [MESSAGING](./MESSAGING/) | Mensageria | Schemas de eventos |

## Convencoes

- REST: `{service}-api.md` ou `{service}-openapi.yaml`
- gRPC: `{service}.proto.md`
- Webhooks: `{provider}-webhooks.md`
- Messaging: `{queue}-schemas.md`
