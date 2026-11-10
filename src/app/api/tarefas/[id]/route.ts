import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tarefas/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tarefa = await db.tarefa.findUnique({
      where: { id },
      include: {
        actividade: { include: { processo: { include: { area: true } } } },
        procedimentos: { orderBy: { passo: 'asc' } },
      },
    })
    if (!tarefa) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    return NextResponse.json(tarefa)
  } catch (error) {
    console.error('Erro ao obter tarefa:', error)
    return NextResponse.json({ error: 'Erro ao obter tarefa' }, { status: 500 })
  }
}

// PUT /api/tarefas/[id] - actualiza a tarefa e automaticamente dataRevisao
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nome, descricao, inputs, outputs, actividadeId, ferramentaIds, instrucoesNasFerramentas, procedimentos } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    // Se vierem procedimentos, elimina os antigos e cria os novos
    if (Array.isArray(procedimentos)) {
      await db.procedimento.deleteMany({ where: { tarefaId: id } })
    }

    const tarefa = await db.tarefa.update({
      where: { id },
      data: {
        nome: nome.trim(),
        descricao: descricao ?? null,
        inputs: inputs ?? '',
        outputs: outputs ?? '',
        instrucoesNasFerramentas: !!instrucoesNasFerramentas,
        actividadeId: actividadeId || undefined,
        ferramentaIds: Array.isArray(ferramentaIds) ? ferramentaIds.join(',') : (ferramentaIds ?? ''),
        // dataRevisao é actualizada automaticamente pelo Prisma (@updatedAt seria em updatedAt;
        // para dataRevisao usamos now() explicitamente)
        dataRevisao: new Date(),
        ...(Array.isArray(procedimentos) ? {
          procedimentos: {
            create: procedimentos
              .filter((p: { descricao?: string }) => p?.descricao?.trim())
              .map((p: { descricao: string }, idx: number) => ({
                passo: idx + 1,
                descricao: p.descricao.trim(),
              })),
          },
        } : {}),
      },
      include: {
        procedimentos: { orderBy: { passo: 'asc' } },
      },
    })
    return NextResponse.json(tarefa)
  } catch (error) {
    console.error('Erro ao actualizar tarefa:', error)
    return NextResponse.json({ error: 'Erro ao actualizar tarefa' }, { status: 500 })
  }
}

// DELETE /api/tarefas/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.tarefa.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao eliminar tarefa:', error)
    return NextResponse.json({ error: 'Erro ao eliminar tarefa' }, { status: 500 })
  }
}
