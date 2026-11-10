import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ferramentas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const areaId = searchParams.get('areaId')
    const ferramentas = await db.ferramenta.findMany({
      where: areaId ? { areaId } : undefined,
      include: { area: { select: { id: true, nome: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(ferramentas)
  } catch (error) {
    console.error('Erro ao listar ferramentas:', error)
    return NextResponse.json({ error: 'Erro ao listar ferramentas' }, { status: 500 })
  }
}

// POST /api/ferramentas
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, descricao, areaId } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    const ferramenta = await db.ferramenta.create({
      data: { nome: nome.trim(), descricao, areaId: areaId || null },
    })
    return NextResponse.json(ferramenta, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar ferramenta:', error)
    return NextResponse.json({ error: 'Erro ao criar ferramenta' }, { status: 500 })
  }
}
