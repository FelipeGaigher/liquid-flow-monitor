# ADR-001: Escolha da Stack Tecnologica

## Status

**Aceito** - Janeiro 2026

## Contexto

O projeto Liquid Flow Monitor necessita de uma stack tecnologica que permita desenvolvimento rapido, manutencao facilitada e boa experiencia do usuario. O sistema sera uma aplicacao web responsiva para gestao de tanques de liquidos.

### Requisitos Considerados

1. Interface moderna e responsiva
2. Desenvolvimento rapido (time-to-market)
3. Facilidade de manutencao
4. Boa documentacao e comunidade
5. Performance adequada
6. Tipagem estatica (reducao de bugs)
7. Ecossistema de componentes

## Decisao

Adotar a seguinte stack tecnologica:

### Frontend

| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| React | 18.3.x | Biblioteca de UI |
| TypeScript | 5.8.x | Tipagem estatica |
| Vite | 5.4.x | Build e dev server |
| TailwindCSS | 3.4.x | Estilizacao |
| shadcn/ui | latest | Componentes UI |
| React Router | 6.x | Roteamento |
| TanStack Query | 5.x | Gerenciamento de dados |
| Recharts | 2.x | Graficos |
| React Hook Form | 7.x | Formularios |
| Zod | 3.x | Validacao |

### Ferramentas

| Ferramenta | Proposito |
|------------|-----------|
| ESLint | Linting |
| PostCSS | Processamento CSS |
| SWC | Transpilacao rapida |

## Consequencias

### Positivas

- **React**: Biblioteca mais popular, grande comunidade, facil contratacao
- **TypeScript**: Reducao significativa de bugs em runtime, melhor IDE support
- **Vite**: Build extremamente rapido, HMR eficiente, configuracao simples
- **TailwindCSS**: Desenvolvimento UI rapido, consistencia visual, bundle otimizado
- **shadcn/ui**: Componentes acessiveis, customizaveis, sem lock-in
- **TanStack Query**: Cache inteligente, refetch automatico, estados de loading

### Negativas

- Curva de aprendizado para desenvolvedores nao familiarizados com React/TypeScript
- shadcn/ui requer configuracao inicial
- TailwindCSS pode gerar classes longas no JSX

### Riscos

| Risco | Mitigacao |
|-------|-----------|
| Atualizacoes breaking | Lock de versoes no package.json |
| Dependencia de terceiros | Componentes copiados (shadcn), nao instalados |
| Performance com muitos dados | Virtualizacao e paginacao |

## Alternativas Consideradas

### Angular

- **Pros**: Framework completo, TypeScript nativo, DI built-in
- **Contras**: Mais verboso, curva de aprendizado maior, menor flexibilidade
- **Decisao**: Rejeitado por complexidade desnecessaria para o escopo

### Vue.js

- **Pros**: Curva de aprendizado menor, sintaxe limpa
- **Contras**: Ecossistema menor, menos opcoes de componentes enterprise
- **Decisao**: Rejeitado por menor disponibilidade de desenvolvedores

### Next.js

- **Pros**: SSR, routing built-in, otimizacoes automaticas
- **Contras**: Overhead para SPA puro, complexidade adicional
- **Decisao**: Rejeitado - SSR nao necessario para aplicacao interna

### CSS Modules / Styled Components

- **Pros**: Escopo local de CSS, CSS-in-JS
- **Contras**: Mais verbose, menor performance (styled-components)
- **Decisao**: TailwindCSS escolhido por produtividade

## Referencias

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

**ADR-001** | Stack Tecnologica | Janeiro 2026
