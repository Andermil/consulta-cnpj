# Consulta CNPJ — React + Tailwind

Frontend responsivo para consultar CNPJ usando a API pública do CNPJ.ws.

## Funcionalidades

- Máscara e validação de CNPJ
- Consulta via `GET https://publica.cnpj.ws/cnpj/{cnpj}`
- Loading e tratamento de erros, inclusive HTTP 404 e 429
- Resumo com razão social, fantasia, situação, endereço, cidade/UF, CNAE, telefone, e-mail, inscrições estaduais e capital social
- Renderização recursiva de todos os campos do JSON
- Objetos, listas e listas de objetos
- Formatação automática de CNPJ, CEP, datas, booleanos e capital social
- Contador de campos preenchidos
- Visualização e cópia do JSON bruto
- Layout responsivo em React + Tailwind

## Desenvolvimento

```bash
npm install
npm run dev
```

## Produção

```bash
npm run build
npm run preview
```

A API pública CNPJ.ws possui limitação de consultas por IP; o aplicativo trata respostas de limite excedido.
