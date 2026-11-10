import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tarefas - listar tarefas (com filtros opcionais)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const actividadeId = searchParams.get('actividadeId')
    const tarefas = await db.tarefa.findMany({
      where: actividadeId ? { actividadeId } : undefined,
      include: {
        actividade: {
          select: {
            id: true,
            nome: true,
            processo: { select: { id: true, nome: true, area: { select: { id: true, nome: true } } } },
          },
        },
        procedimentos: { orderBy: { passo: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tarefas)
  } catch (error) {
    console.error('Erro ao listar tarefas:', error)
    return NextResponse.json({ error: 'Erro ao listar tarefas' }, { status: 500 })
  }
}

// POST /api/tarefas - criar nova tarefa com procedimentos e ferramentas
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      nome, descricao, inputs, outputs, actividadeId, ferramentaIds, procedimentos,
      instrucoesNasFerramentas
    } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!actividadeId) return NextResponse.json({ error: 'Actividade é obrigatória' }, { status: 400 })

    // Validar que a actividade existe
    const actividade = await db.actividade.findUnique({ where: { id: actividadeId } })
    if (!actividade) return NextResponse.json({ error: 'Actividade não encontrada' }, { status: 404 })

    const tarefa = await db.tarefa.create({
      data: {
        nome: nome.trim(),
        descricao: descricao || null,
        inputs: inputs || '',
        outputs: outputs || '',
        instrucoesNasFerramentas: !!instrucoesNasFerramentas,
        actividadeId,
        ferramentaIds: Array.isArray(ferramentaIds) ? ferramentaIds.join(',') : (ferramentaIds || ''),
        // dataRevisao é definida automaticamente pelo @default(now())
        procedimentos: {
          create: Array.isArray(procedimentos)
            ? procedimentos
                .filter((p: { descricao?: string }) => p?.descricao?.trim())
                .map((p: { descricao: string }, idx: number) => ({
                  passo: idx + 1,
                  descricao: p.descricao.trim(),
                }))
            : [],
        },
      },
      include: {
        actividade: { select: { id: true, nome: true, processo: { select: { nome: true, area: { select: { nome: true } } } } } },
        procedimentos: { orderBy: { passo: 'asc' } },
      },
    })
    return NextResponse.json(tarefa, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}
