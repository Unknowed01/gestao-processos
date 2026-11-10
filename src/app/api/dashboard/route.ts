import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard - estatísticas gerais do sistema
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

    // Tarefas recentes (com contexto completo)
    const tarefasRecentes = await db.tarefa.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        inputs: true,
        outputs: true,
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

    // Distribuição de processos por tipo
    const processosPorTipo = await db.processo.groupBy({
      by: ['tipo'],
      _count: true,
    })

    // Distribuição de processos por frequência
    const processosPorFreq = await db.processo.groupBy({
      by: ['frequencia'],
      _count: true,
    })

    // Áreas com contagem (top 6 por nº de processos)
    const areasComContagem = await db.area.findMany({
      select: {
        id: true,
        nome: true,
        objectivos: true,
        _count: {
          select: { processos: true, membros: true, ferramentas: true },
        },
      },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json({
      counts: { areas, processos, actividades, tarefas, membros, ferramentas },
      tarefasRecentes,
      processosPorTipo,
      processosPorFreq,
      areasComContagem,
    })
  } catch (error) {
    console.error('Erro ao obter dashboard:', error)
    return NextResponse.json({ error: 'Erro ao obter dashboard' }, { status: 500 })
  }
}
