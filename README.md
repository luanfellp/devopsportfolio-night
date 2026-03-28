# Luan Moura — Portfolio (Astro)

Site estático migrado para **Astro** com pipeline CI/CD completo via **GitHub Actions**.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | [Astro](https://astro.build) v4 (output: static) |
| Linting | ESLint + eslint-plugin-astro |
| Types | TypeScript (strict) |
| CI/CD | GitHub Actions |
| Hospedagem | AWS S3 + CloudFront |

---

## Comandos locais

```bash
npm install      # instala dependências
npm run dev      # servidor local → http://localhost:4321
npm run build    # gera dist/
npm run preview  # serve dist/ localmente
npm run lint     # ESLint
npm run typecheck # tsc --noEmit
```

---

## Estrutura do projeto

```
portfolio-astro/
├── .github/
│   └── workflows/
│       ├── deploy.yml    # main → build + S3 + CloudFront
│       ├── preview.yml   # PR   → preview isolado + cleanup
│       └── ci.yml        # outras branches → lint + build
├── public/
│   └── assets/           # imagens (luan.png, thumbs de projetos)
├── src/
│   ├── layouts/
│   │   └── Layout.astro  # HTML base, CSS global, fonts
│   └── pages/
│       └── index.astro   # página principal (dados centralizados no frontmatter)
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Configurar CI/CD no GitHub

### 1. Secrets necessários

Vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Descrição |
|--------|-----------|
| `AWS_ACCESS_KEY_ID` | Chave IAM com permissões S3 + CloudFront |
| `AWS_SECRET_ACCESS_KEY` | Secret da chave IAM |
| `AWS_REGION` | Ex: `us-east-1` |
| `S3_BUCKET` | Nome do bucket de produção (sem `s3://`) |
| `S3_BUCKET_PREVIEW` | Bucket para previews de PR (pode ser o mesmo) |
| `CF_DISTRIBUTION_ID` | ID da distribuição CloudFront |

### 2. Permissões IAM mínimas (least privilege)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::SEU-BUCKET",
        "arn:aws:s3:::SEU-BUCKET/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/CF_DISTRIBUTION_ID"
    }
  ]
}
```

### 3. Fluxo dos workflows

```
push → feature/xxx  →  ci.yml        (lint + typecheck + build)
                          ↓ aprovado
open PR              →  preview.yml  (build + deploy em /previews/pr-N/)
                          ↓ bot comenta URL no PR
merge → main         →  deploy.yml   (build + S3 sync + CF invalidation)
close PR             →  preview.yml  (cleanup: remove /previews/pr-N/)
```

---

## Adicionar projetos

Edite o array `projects` no frontmatter de `src/pages/index.astro`:

```ts
const projects = [
  {
    title: 'Nome do Projeto',
    desc: 'Descrição curta.',
    image: '/assets/meu-projeto.png',
    tags: ['AWS', 'Terraform'],
    status: 'live',   // 'live' | 'wip' | 'study'
    github: 'https://github.com/...',
    live: 'https://...',
  },
];
```

Coloque a imagem em `public/assets/` e atualize o `src`.
