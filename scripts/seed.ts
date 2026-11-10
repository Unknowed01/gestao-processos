import { db } from '@/lib/db'

// Seeds das áreas reais (baseado no organograma da imagem enviada)
// Executado via: bun run scripts/seed.ts

async function main() {
  console.log('🌱 Iniciando seed das áreas...')

  // Limpa dados existentes (ordem importa devido às FKs)
  await db.procedimento.deleteMany()
  await db.tarefa.deleteMany()
  await db.actividade.deleteMany()
  await db.processo.deleteMany()
  await db.membro.deleteMany()
  await db.ferramenta.deleteMany()
  await db.area.deleteMany()

  // === Áreas Comerciais (sob Administrador Comercial) ===
  const comercial = [
    { nome: 'Corretagem', descricao: 'Gestão de corretores e produção via canal de corretagem.', objectivos: 'Crescimento da produção via corretores; retenção de carteira.' },
    { nome: 'Mediação', descricao: 'Gestão de mediadores e produção via canal de mediação.', objectivos: 'Expansão da rede de mediadores; qualidade da produção.' },
    { nome: 'Banca', descricao: 'Distribuição de seguros via rede bancária.', objectivos: 'Penetração bancária; cross-selling.' },
    { nome: 'Directos e Institucionais', descricao: 'Comercialização directa e grandes contas institucionais.', objectivos: 'Aquisição directa; fidelização de grandes clientes.' },
    { nome: 'Inovação Comercial', descricao: 'Novos produtos, canais e modelos de comercialização.', objectivos: 'Lançamento de novos produtos; novos canais digitais.' },
    { nome: 'Academia Comercial', descricao: 'Formação e capacitação da força comercial.', objectivos: 'Capacitação contínua; certificação de mediadores.' },
  ]

  // === Áreas Corporativas (sob Presidente) ===
  const corporativas = [
    { nome: 'Jurídico e Legal', descricao: 'Acompanhamento jurídico, contratos e contencioso.', objectivos: 'Conformidade legal; mitigação de risco jurídico.' },
    { nome: 'Gestão de Investimentos', descricao: 'Gestão das aplicações e portfolio de investimentos.', objectivos: 'Rentabilidade; diversificação; controlo de risco.' },
    { nome: 'Marketing e Comunicação', descricao: 'Branding, comunicação e marketing da companhia.', objectivos: 'Notoriedade de marca; geração de leads.' },
    { nome: 'Org. Inf. Tecnologias', descricao: 'Tecnologias de informação e sistemas.', objectivos: 'Estabilidade técnica; modernização digital.' },
    { nome: 'Recursos Humanos e Admin', descricao: 'Gestão de pessoas e administração geral.', objectivos: 'Atração e retenção de talento; eficiência administrativa.' },
  ]

  // === Áreas Técnicas (sob Administrador Técnico) ===
  const tecnicas = [
    { nome: 'Subscrição e Gestão de Portfólio', descricao: 'Subscrição de riscos e gestão técnica da carteira.', objectivos: 'Rentabilidade técnica; equilíbrio da carteira.' },
    { nome: 'Gestão de Operações', descricao: 'Operações de seguros: emissão, endossos, alterações.', objectivos: 'Eficiência operacional; qualidade de serviço.' },
    { nome: 'Gestão de Sinistros', descricao: 'Tratamento e liquidação de sinistros.', objectivos: 'Agilidade na regularização; equidade técnica; contenção de custos.' },
    { nome: 'Financeira e Cobranças', descricao: 'Tesouraria, cobranças e pagamentos.', objectivos: 'Saúde financeira; redução de incobráveis.' },
    { nome: 'Contabilidade e Fiscalidade', descricao: 'Contabilidade geral e gestão fiscal.', objectivos: 'Conformidade contabilística e fiscal; reporte atempado.' },
    { nome: 'Resseguro e Co-seguro', descricao: 'Colocação de resseguro e gestão de co-seguros.', objectivos: 'Protecção do balanço; otimização de retenções.' },
    { nome: 'Actuariado, Plan e Reporting', descricao: 'Estudos actuariais, planeamento e reporte técnico.', objectivos: 'Provisões adequadas; reporting regulatório; planeamento estratégico.' },
  ]

  // === Áreas de Controlo (sob Comissão Executiva) ===
  const controlo = [
    { nome: 'Compliance Officer', descricao: 'Conformidade regulamentar e normativa.', objectivos: 'Conformidade com normas; prevenção de violações.' },
    { nome: 'Centro Reclamações / Conduta de Mercado', descricao: 'Tratamento de reclamações e conduta de mercado.', objectivos: 'Satisfação do cliente; conduta responsável.' },
    { nome: 'Provedor Cliente', descricao: 'Defesa dos direitos dos clientes.', objectivos: 'Resolução justa de conflitos; voz do cliente.' },
    { nome: 'Gestão de Riscos', descricao: 'Identificação, avaliação e mitigação de riscos.', objectivos: 'Mapa de riscos actualizado; planos de mitigação.' },
    { nome: 'Controlo Interno', descricao: 'Controlos internos e governação.', objectivos: 'Controlos eficazes; governação robusta.' },
    { nome: 'Auditoria Interna', descricao: 'Auditoria interna e revisão independente.', objectivos: 'Assegurar a integridade dos processos; recomendações accionáveis.' },
  ]

  const todas = [...comercial, ...corporativas, ...tecnicas, ...controlo]

  for (const area of todas) {
    await db.area.create({ data: area })
    console.log(`  ✓ Área criada: ${area.nome}`)
  }

  console.log(`\n✅ Seed concluído: ${todas.length} áreas criadas.`)
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
