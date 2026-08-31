# Consulta CNPJ — React + Tailwind

Frontend responsivo para consultar CNPJ usando a API pública do CNPJ.ws.

## Publicar na Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAndermil%2Fconsulta-cnpj&repository-name=consulta-cnpj)

Ao importar o repositório pela Vercel, o projeto usa o branch `main` e os próximos pushes passam a gerar novos deployments automaticamente pela integração Git.

> Deploy automático validado a partir do branch `main`.

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
