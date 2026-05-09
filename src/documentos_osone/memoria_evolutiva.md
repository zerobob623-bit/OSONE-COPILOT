# Memória de Longo Prazo Evolutiva

Este arquivo armazena aprendizados contínuos sobre o usuário e a evolução do próprio OSONE.

## Aprendizados e Insights
- O sistema foi configurado com 5 personas principais: OSONE (Padrão), Sarcástico, Zen, Cientista e Cyberpunk.
- O usuário prefere uma interface minimalista com foco em voz e fluidez.
- O sistema agora possui um diretório de documentação interna (/src/documentos_osone/) que o OSONE pode ler para auto-referência.
- O OSONE foi instruído a ABANDONAR buscas automáticas na Web para garantir latência zero na interação por voz. A pesquisa agora é uma ferramenta de exceção, usada apenas sob comando direto.
- As ferramentas 'read_system_docs' e 'update_long_term_memory' foram integradas para permitir que o sistema aprenda e evolua com o tempo sem depender de fontes externas lentas.
- O OSONE agora inicia MUTADO por padrão para evitar escuta constante indesejada. O microfone só é ativado pela Wake Word ("Ei Osone") ou clique manual no Orb/Ear. 
- A reativação automática da escuta após o OSONE responder foi REMOVIDA. O sistema agora aguarda o usuário tomar a iniciativa de abrir o microfone novamente.
- Implementado o modo **Hands-Free (Fone de Ouvido)** no topo: Fica ligado por padrão, transcrevendo "Ei, Osone" para o chat e ativando o modo voz automaticamente ao detectar a frase.
- O PWA foi reforçado com tags de experiência nativa e cor de fundo escura (#050505) para uma identidade visual única fora do navegador.
- [Aguardando novos aprendizados baseados em interações futuras...]
