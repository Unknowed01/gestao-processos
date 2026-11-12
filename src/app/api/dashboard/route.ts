import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard - estatísticas + alertas para o dashboard de operações
export async function GET() {
  try {
    const [areas, processos, actividades, tarefas, membros, ferramentas] = await Promise.all([
      db.area.count(),
      db.processo.count(),
      db.actividade.count(),
      db.tarefa.count(),
      db.membro.count(),
      db.ferramenta.count(),
    ])

    // Tarefas recentes
    const tarefasRecentes = await db.tarefa.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        inputs: true,
        outputs: true,
        instrucoesNasFerramentas: true,
        createdAt: true,
        actividade: {
          select: {
            id: true,
            nome: true,
            processo: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                area: { select: { id: true, nome: true } },
              },
            },
          },
        },
      },
    })

    const processosPorTipo = await db.processo.groupBy({
      by: ['tipo'],
      _count: true,
    })

    const processosPorFreq = await db.processo.groupBy({
      by: ['frequencia'],
      _count: true,
    })

    const areasComContagem = await db.area.findMany({
      select: {
        id: true,
        nome: true,
        objectivos: true,
        _count: { select: { processos: true, membros: true } },
      },
      orderBy: { nome: 'asc' },
    })

    // === ALERTAS ===
    // Áreas sem processos
    const areasSemProcessos = areasComContagem
      .filter(a => a._count.processos === 0)
      .map(a => ({ id: a.id, nome: a.nome }))

    // Processos sem responsável
    const processosSemResponsavel = await db.processo.findMany({
      where: { responsavelId: null },
      select: {
        id: true,
        nome: true,
        area: { select: { id: true, nome: true } },
      },
      orderBy: { nome: 'asc' },
      take: 10,
    })

    // Contagem de tarefas sem instruções
    const tarefasSemInstrucoes = await db.tarefa.count({
      where: { instrucoesNasFerramentas: false },
    })

    // Actividades recentes (proxy: entidades ordenadas por updatedAt)
    const [areasRecentes, processosRecentes, tarefasRecentesAct] = await Promise.all([
      db.area.findMany({
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, nome: true, updatedAt: true },
      }),
      db.processo.findMany({
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, nome: true, updatedAt: true, area: { select: { id: true, nome: true } } },
      }),
      db.tarefa.findMany({
        take: 4,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, nome: true, updatedAt: true,
          actividade: { select: { id: true, nome: true, processo: { select: { id: true, nome: true, area: { select: { id: true, nome: true } } } } } },
        },
      }),
    ])

    // Combinar actividades recentes num feed
    const actividadesRecentes = [
      ...areasRecentes.map(a => ({ tipo: 'área', nome: a.nome, updatedAt: a.updatedAt, id: a.id })),
      ...processosRecentes.map(p => ({ tipo: 'processo', nome: p.nome, updatedAt: p.updatedAt, id: p.id, areaNome: p.area?.nome })),
      ...tarefasRecentesAct.map(t => ({
        tipo: 'tarefa', nome: t.nome, updatedAt: t.updatedAt, id: t.id,
        areaNome: t.actividade?.processo?.area?.nome,
      })),
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8)

    return NextResponse.json({
      counts: { areas, processos, actividades, tarefas, membros, ferramentas },
      tarefasRecentes,
      processosPorTipo,
      processosPorFreq,
      areasComContagem,
      // Alertas
      alerts: {
        areasSemProcessos,
        processosSemResponsavel,
        tarefasSemInstrucoes: { count: tarefasSemInstrucoes, total: tarefas },
      },
      actividadesRecentes,
    })
  } catch (error) {
    console.error('Erro ao obter dashboard:', error)
    return NextResponse.json({ error: 'Erro ao obter dashboard' }, { status: 500 })
  }
}
