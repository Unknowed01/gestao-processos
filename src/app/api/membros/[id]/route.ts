import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { membroUpdateSchema, validateOrError } from '@/lib/schemas'

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
// Suporta actualização completa (todos os campos) ou parcial (apenas areaId).
// Ambos os modos são validados com o mesmo schema usado na criação (incl. formato do email).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const validation = validateOrError(membroUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { nome, email, cargo, areaId } = validation.data

    // Modo parcial: apenas actualizar areaId (para associação a área)
    if (!nome) {
      if (areaId === undefined) {
        return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
      }
      const membro = await db.membro.update({
        where: { id },
        data: { areaId: areaId || null },
      })
      return NextResponse.json(membro)
    }

    // Modo completo: actualizar todos os campos
    const membro = await db.membro.update({
      where: { id },
      data: {
        nome,
        email: email || null,
        cargo: cargo || null,
        areaId: areaId || null,
      },
    })
    return NextResponse.json(membro)
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }
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
