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

    // Tarefas recentes
    const tarefasRecentes = await db.tarefa.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        actividade: {
          select: {
            nome: true,
            processo: { select: { nome: true, area: { select: { nome: true } } } },
          },
        },
      },
    })

    // Distribuição de processos por tipo
    const processosPorTipo = await db.processo.groupBy({
      by: ['tipo'],
      _count: true,
    })

    return NextResponse.json({
      counts: { areas, processos, actividades, tarefas, membros, ferramentas },
      tarefasRecentes,
      processosPorTipo,
    })
  } catch (error) {
    console.error('Erro ao obter dashboard:', error)
    return NextResponse.json({ error: 'Erro ao obter dashboard' }, { status: 500 })
  }
}
