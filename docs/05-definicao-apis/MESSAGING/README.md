# Messaging

Schemas de eventos e mensagens assincronas.

## Convencoes

- `{queue}-schemas.md`: Schemas de uma fila especifica
- `{event}-event.md`: Documentacao de um evento

## Tecnologias Suportadas

- RabbitMQ
- Apache Kafka
- AWS SQS/SNS
- Redis Pub/Sub

## Estrutura de Documentacao

1. Nome da fila/topico
2. Tipo de exchange (se aplicavel)
3. Schema da mensagem (JSON Schema)
4. Produtor(es)
5. Consumidor(es)
6. Politica de retry/DLQ
