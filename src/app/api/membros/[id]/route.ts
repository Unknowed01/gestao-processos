import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/membros/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const membro = await db.membro.findUnique({
      where: { id },
      include: {
        area: true,
        procResp: { include: { area: { select: { nome: true } } } },
        procSubst: { include: { area: { select: { nome: true } } } },
        actResp: { include: { processo: { select: { nome: true } } } },
        actSubst: { include: { processo: { select: { nome: true } } } },
      },
    })
    if (!membro) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    return NextResponse.json(membro)
  } catch (error) {
    console.error('Erro ao obter membro:', error)
    return NextResponse.json({ error: 'Erro ao obter membro' }, { status: 500 })
  }
}

// PUT /api/membros/[id]
// Suporta actualização completa (todos os campos) ou parcial (apenas areaId)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nome, email, cargo, areaId } = body

    // Modo parcial: apenas actualizar areaId (para associação a área)
    if (!nome && body.areaId !== undefined) {
      const membro = await db.membro.update({
        where: { id },
        data: { areaId: areaId || null },
      })
      return NextResponse.json(membro)
    }

    // Modo completo: actualizar todos os campos
    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }
    const membro = await db.membro.update({
      where: { id },
      data: {
        nome: nome.trim(),
        email: email?.trim() || null,
        cargo: cargo?.trim() || null,
        areaId: areaId || null,
      },
    })
    return NextResponse.json(membro)
  } catch (error) {
    console.error('Erro ao actualizar membro:', error)
    return NextResponse.json({ error: 'Erro ao actualizar membro' }, { status: 500 })
  }
}

// DELETE /api/membros/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.membro.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao eliminar membro:', error)
    return NextResponse.json({ error: 'Erro ao eliminar membro' }, { status: 500 })
  }
}
