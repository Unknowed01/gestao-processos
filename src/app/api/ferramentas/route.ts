import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ferramentaCreateSchema, validateOrError } from '@/lib/schemas'

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
    const validation = validateOrError(ferramentaCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { nome, descricao } = validation.data
    const ferramenta = await db.ferramenta.create({
      data: { nome, descricao },
    })
    return NextResponse.json(ferramenta, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar ferramenta:', error)
    return NextResponse.json({ error: 'Erro ao criar ferramenta' }, { status: 500 })
  }
}
