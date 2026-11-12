import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { areaCreateSchema, validateOrError } from '@/lib/schemas'

// GET /api/areas - listar todas as áreas (versão sumária)
export async function GET() {
  try {
    const areas = await db.area.findMany({
      include: {
        _count: { select: { processos: true, membros: true } },
      },
      orderBy: { nome: 'asc' },
    })
    return NextResponse.json(areas)
  } catch (error) {
    console.error('Erro ao listar áreas:', error)
    return NextResponse.json({ error: 'Erro ao listar áreas' }, { status: 500 })
  }
}

// POST /api/areas - criar nova área
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = validateOrError(areaCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { nome, descricao, objectivos } = validation.data
    const area = await db.area.create({
      data: { nome, descricao, objectivos },
    })
    return NextResponse.json(area, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar área:', error)
    return NextResponse.json({ error: 'Erro ao criar área' }, { status: 500 })
  }
}
