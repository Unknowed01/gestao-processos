import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/areas/[id] - detalhe completo de uma área
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const area = await db.area.findUnique({
      where: { id },
      include: {
        processos: {
          include: {
            responsavel: { select: { id: true, nome: true } },
            substituto: { select: { id: true, nome: true } },
            _count: { select: { actividades: true } },
          },
          orderBy: { nome: 'asc' },
        },
        membros: {
          include: {
            _count: {
              select: { procResp: true, procSubst: true, actResp: true, actSubst: true },
            },
          },
          orderBy: { nome: 'asc' },
        },
        ferramentas: { orderBy: { nome: 'asc' } },
        _count: { select: { processos: true, membros: true, ferramentas: true } },
      },
    })
    if (!area) return NextResponse.json({ error: 'Área não encontrada' }, { status: 404 })
    return NextResponse.json(area)
  } catch (error) {
    console.error('Erro ao obter área:', error)
    return NextResponse.json({ error: 'Erro ao obter área' }, { status: 500 })
  }
}

// PUT /api/areas/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nome, descricao, objectivos } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    const area = await db.area.update({
      where: { id },
      data: { nome: nome.trim(), descricao, objectivos },
    })
    return NextResponse.json(area)
  } catch (error) {
    console.error('Erro ao actualizar área:', error)
    return NextResponse.json({ error: 'Erro ao actualizar área' }, { status: 500 })
  }
}

// DELETE /api/areas/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.area.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao eliminar área:', error)
    return NextResponse.json({ error: 'Erro ao eliminar área' }, { status: 500 })
  }
}
