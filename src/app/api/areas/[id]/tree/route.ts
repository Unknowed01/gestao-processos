import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/areas/[id]/tree - retorna a hierarquia completa de uma área
// (processos > actividades > tarefas) para alimentar a sidebar em árvore
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const area = await db.area.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        descricao: true,
        objectivos: true,
        processos: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            frequencia: true,
            actividades: {
              select: {
                id: true,
                nome: true,
                frequencia: true,
                tarefas: {
                  select: {
                    id: true,
                    nome: true,
                    instrucoesNasFerramentas: true,
                  },
                  orderBy: { nome: 'asc' },
                },
              },
              orderBy: { nome: 'asc' },
            },
          },
          orderBy: { nome: 'asc' },
        },
        membros: {
          select: { id: true, nome: true, cargo: true },
          orderBy: { nome: 'asc' },
        },
        _count: { select: { processos: true, membros: true } },
      },
    })
    if (!area) return NextResponse.json({ error: 'Área não encontrada' }, { status: 404 })
    return NextResponse.json(area)
  } catch (error) {
    console.error('Erro ao obter árvore da área:', error)
    return NextResponse.json({ error: 'Erro ao obter árvore' }, { status: 500 })
  }
}
