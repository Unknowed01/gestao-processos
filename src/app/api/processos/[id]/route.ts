import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/processos/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const processo = await db.processo.findUnique({
      where: { id },
      include: {
        area: true,
        responsavel: true,
        substituto: true,
        actividades: { include: { _count: { select: { tarefas: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
    return NextResponse.json(processo)
  } catch (error) {
    console.error('Erro ao obter processo:', error)
    return NextResponse.json({ error: 'Erro ao obter processo' }, { status: 500 })
  }
}

// PUT /api/processos/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nome, descricao, tipo, frequencia, areaId, responsavelId, substitutoId } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    const processo = await db.processo.update({
      where: { id },
      data: {
        nome: nome.trim(),
        descricao,
        tipo,
        frequencia,
        areaId: areaId || null,
        responsavelId: responsavelId || null,
        substitutoId: substitutoId || null,
      },
    })
    return NextResponse.json(processo)
  } catch (error) {
    console.error('Erro ao actualizar processo:', error)
    return NextResponse.json({ error: 'Erro ao actualizar processo' }, { status: 500 })
  }
}

// DELETE /api/processos/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.processo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao eliminar processo:', error)
    return NextResponse.json({ error: 'Erro ao eliminar processo' }, { status: 500 })
  }
}
