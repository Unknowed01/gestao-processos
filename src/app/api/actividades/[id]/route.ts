import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/actividades/[id] - detalhe completo de uma actividade com suas tarefas
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const actividade = await db.actividade.findUnique({
      where: { id },
      include: {
        processo: {
          select: {
            id: true, nome: true, tipo: true, frequencia: true,
            area: { select: { id: true, nome: true } },
          },
        },
        responsavel: { select: { id: true, nome: true, cargo: true } },
        substituto: { select: { id: true, nome: true, cargo: true } },
        tarefas: {
          include: {
            procedimentos: { orderBy: { passo: 'asc' } },
            _count: { select: { procedimentos: true } },
          },
          orderBy: { nome: 'asc' },
        },
        _count: { select: { tarefas: true } },
      },
    })
    if (!actividade) return NextResponse.json({ error: 'Actividade não encontrada' }, { status: 404 })
    return NextResponse.json(actividade)
  } catch (error) {
    console.error('Erro ao obter actividade:', error)
    return NextResponse.json({ error: 'Erro ao obter actividade' }, { status: 500 })
  }
}

// PUT /api/actividades/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nome, descricao, frequencia, processoId, responsavelId, substitutoId } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    const actividade = await db.actividade.update({
      where: { id },
      data: {
        nome: nome.trim(),
        descricao,
        frequencia,
        processoId,
        responsavelId: responsavelId || null,
        substitutoId: substitutoId || null,
      },
    })
    return NextResponse.json(actividade)
  } catch (error) {
    console.error('Erro ao actualizar actividade:', error)
    return NextResponse.json({ error: 'Erro ao actualizar actividade' }, { status: 500 })
  }
}

// DELETE /api/actividades/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.actividade.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao eliminar actividade:', error)
    return NextResponse.json({ error: 'Erro ao eliminar actividade' }, { status: 500 })
  }
}
