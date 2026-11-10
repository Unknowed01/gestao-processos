import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/areas - listar todas as áreas
export async function GET() {
  try {
    const areas = await db.area.findMany({
      include: {
        _count: { select: { processos: true, membros: true, ferramentas: true } },
      },
      orderBy: { createdAt: 'desc' },
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
    const { nome, descricao, objectivos } = body
    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }
    const area = await db.area.create({
      data: { nome: nome.trim(), descricao, objectivos },
    })
    return NextResponse.json(area, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar área:', error)
    return NextResponse.json({ error: 'Erro ao criar área' }, { status: 500 })
  }
}
