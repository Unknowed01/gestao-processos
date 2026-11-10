import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ferramentas
export async function GET() {
  try {
    const ferramentas = await db.ferramenta.findMany({
      orderBy: { nome: 'asc' },
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
    const { nome, descricao } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    const ferramenta = await db.ferramenta.create({
      data: { nome: nome.trim(), descricao },
    })
    return NextResponse.json(ferramenta, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar ferramenta:', error)
    return NextResponse.json({ error: 'Erro ao criar ferramenta' }, { status: 500 })
  }
}
