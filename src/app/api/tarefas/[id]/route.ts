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
