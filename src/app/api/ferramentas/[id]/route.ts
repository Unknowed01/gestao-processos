import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ferramentas/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ferramenta = await db.ferramenta.findUnique({ where: { id } })
    if (!ferramenta) return NextResponse.json({ error: 'Ferramenta não encontrada' }, { status: 404 })
    return NextResponse.json(ferramenta)
  } catch (error) {
    console.error('Erro ao obter ferramenta:', error)
    return NextResponse.json({ error: 'Erro ao obter ferramenta' }, { status: 500 })
  }
}

// PUT /api/ferramentas/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nome, descricao } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    const ferramenta = await db.ferramenta.update({
      where: { id },
      data: {
        nome: nome.trim(),
        descricao,
      },
    })
    return NextResponse.json(ferramenta)
  } catch (error) {
    console.error('Erro ao actualizar ferramenta:', error)
    return NextResponse.json({ error: 'Erro ao actualizar ferramenta' }, { status: 500 })
  }
}

// DELETE /api/ferramentas/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.ferramenta.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao eliminar ferramenta:', error)
    return NextResponse.json({ error: 'Erro ao eliminar ferramenta' }, { status: 500 })
  }
}
