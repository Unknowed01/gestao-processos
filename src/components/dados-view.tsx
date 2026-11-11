'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Download, Upload, FileJson, FileSpreadsheet, FileText,
  Loader2, CheckCircle2, AlertTriangle, Filter, Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Area } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ImportResult {
  success: boolean
  imported: {
    areas: number; processos: number; actividades: number; tarefas: number
    membros: number; ferramentas: number; procedimentos: number
  }
  message: string
}

export function DadosView({ areas }: { areas: Area[] }) {
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [replaceOnImport, setReplaceOnImport] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleArea = (id: string) => {
    setSelectedAreas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedAreas(new Set(areas.map(a => a.id)))
  const selectNone = () => setSelectedAreas(new Set())

  // Exportar dados
  const handleExport = async (format: 'json' | 'csv' | 'xlsx') => {
    setExporting(format)
    try {
      const areaIds = selectedAreas.size > 0 ? Array.from(selectedAreas).join(',') : ''
      const url = `/api/export?format=${format}${areaIds ? `&areas=${areaIds}` : ''}`
      const res = await fetch(url)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro ao exportar' }))
        throw new Error(err.error)
      }
      const blob = await res.blob()
      const contentDisposition = res.headers.get('Content-Disposition')
      let filename = `gestao-processos-${Date.now()}.${format}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match) filename = match[1]
      }
      // Download
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
      toast.success(`Exportado em ${format.toUpperCase()} com sucesso!`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setExporting(null)
    }
  }

  // Importar dados
  const handleImport = async (file: File) => {
    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      let parsedData
      try {
        const raw = JSON.parse(text)
        // Suporta tanto { areas, processos, ... } como { data: { ... } }
        parsedData = raw.data ? raw.data : raw
      } catch {
        throw new Error('Ficheiro JSON inválido')
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsedData, replace: replaceOnImport }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setImportResult(result)
      toast.success('Importação concluída!')
      // Limpar o input para permitir re-importar o mesmo ficheiro
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const selectedCount = selectedAreas.size
  const totalAreas = areas.length
  const allSelected = selectedCount === totalAreas

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2">
          <Database className="w-7 h-7 text-primary" />
          Gestão de Dados
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Exporte e importe todos os dados do sistema (áreas, processos, actividades, tarefas, membros, ferramentas e procedimentos).
        </p>
      </div>

      <Tabs defaultValue="exportar">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="exportar" className="text-sm">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </TabsTrigger>
          <TabsTrigger value="importar" className="text-sm">
            <Upload className="w-4 h-4 mr-2" /> Importar
          </TabsTrigger>
        </TabsList>

        {/* ============ EXPORTAR ============ */}
        <TabsContent value="exportar" className="space-y-4 mt-4">
          {/* Filtros por área */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Filtros de Exportação
              </CardTitle>
              <CardDescription className="text-xs">
                Seleccione as áreas a incluir. Se nenhuma seleccionada, exporta tudo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll} disabled={allSelected}>
                  Selecionar tudo
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone} disabled={selectedCount === 0}>
                  Limpar selecção
                </Button>
                <Badge variant="secondary" className="ml-auto">
                  {selectedCount === 0 ? 'Todas as áreas' : `${selectedCount} de ${totalAreas} áreas`}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                {areas.map(area => (
                  <label
                    key={area.id}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors",
                      selectedAreas.has(area.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <Checkbox
                      checked={selectedAreas.has(area.id)}
                      onCheckedChange={() => toggleArea(area.id)}
                      aria-label={`Incluir ${area.nome} na exportação`}
                    />
                    <span className="text-sm truncate flex-1">{area.nome}</span>
                    {area._count?.processos ? (
                      <Badge variant="secondary" className="text-[10px] py-0">{area._count.processos}p</Badge>
                    ) : null}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Formatos de exportação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Formato de Exportação</CardTitle>
              <CardDescription className="text-xs">
                Escolha o formato do ficheiro. O JSON inclui toda a estrutura e permite re-importar. O CSV e Excel são melhores para análise e partilha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* JSON */}
                <button
                  onClick={() => handleExport('json')}
                  disabled={exporting !== null}
                  className="group text-left"
                >
                  <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all">
                    <CardContent className="p-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                        {exporting === 'json' ? (
                          <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                        ) : (
                          <FileJson className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">JSON</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estrutura completa com todas as relações. Permite re-importar.
                      </p>
                    </CardContent>
                  </Card>
                </button>

                {/* CSV */}
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting !== null}
                  className="group text-left"
                >
                  <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all">
                    <CardContent className="p-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                        {exporting === 'csv' ? (
                          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                        ) : (
                          <FileText className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">CSV</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tabela plana com uma linha por tarefa (vista hierárquica). Ideal para Excel.
                      </p>
                    </CardContent>
                  </Card>
                </button>

                {/* Excel */}
                <button
                  onClick={() => handleExport('xlsx')}
                  disabled={exporting !== null}
                  className="group text-left"
                >
                  <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all">
                    <CardContent className="p-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center mb-3">
                        {exporting === 'xlsx' ? (
                          <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">Excel (.xlsx)</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Múltiplas folhas: Tarefas, Áreas, Processos, Actividades, Membros, Ferramentas.
                      </p>
                    </CardContent>
                  </Card>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Info sobre o que é exportado */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">O que é exportado:</strong> Áreas, Processos (com KPIs e Obrigações Regulamentares),
                Actividades, Tarefas (com Inputs, Outputs, Instruções nas Ferramentas e Data de Revisão),
                Procedimentos, Membros e Ferramentas. Os IDs são preservados para permitir re-importação.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ IMPORTAR ============ */}
        <TabsContent value="importar" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Importar Dados
              </CardTitle>
              <CardDescription className="text-xs">
                Carregue um ficheiro JSON exportado anteriormente. A importação usa <code className="text-xs bg-muted px-1 py-0.5 rounded">upsert</code> —
                actualiza registos existentes (mesmo ID) e cria novos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Opção replace */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                <Checkbox
                  id="replace-import"
                  checked={replaceOnImport}
                  onCheckedChange={(checked) => setReplaceOnImport(!!checked)}
                  className="mt-0.5"
                  aria-label="Substituir todos os dados existentes antes de importar"
                />
                <div className="flex-1">
                  <Label htmlFor="replace-import" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Substituir todos os dados existentes
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Se activo, apaga todos os dados actuais antes de importar. Use com cuidado — esta acção não pode ser desfeita.
                    Recomendado apenas para restaurar backups completos.
                  </p>
                </div>
              </div>

              {/* Upload area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  importing ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
                onClick={() => !importing && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImport(file)
                  }}
                  disabled={importing}
                />
                {importing ? (
                  <>
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium">A importar...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm font-medium">Clique para seleccionar um ficheiro JSON</p>
                    <p className="text-xs text-muted-foreground mt-1">Apenas ficheiros .json exportados deste sistema</p>
                  </>
                )}
              </div>

              {/* Resultado da importação */}
              {importResult && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-900">Importação concluída</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                          {Object.entries(importResult.imported).map(([key, val]) => (
                            val > 0 ? (
                              <div key={key} className="text-xs">
                                <span className="font-semibold text-emerald-700">{val}</span>{' '}
                                <span className="text-muted-foreground">
                                  {key === 'areas' ? 'áreas' : key === 'processos' ? 'processos' : key === 'actividades' ? 'actividades' : key === 'tarefas' ? 'tarefas' : key === 'membros' ? 'membros' : key === 'ferramentas' ? 'ferramentas' : 'procedimentos'}
                                </span>
                              </div>
                            ) : null
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Aviso */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Como funciona:</strong> A importação preserva os IDs do ficheiro JSON.
                Se um registo com o mesmo ID já existir, será actualizado com os novos dados. Se não existir, será criado.
                As relações (ex.: processo → área) são validadas — se a área de destino não existir, o processo é ignorado.
                A validação de responsável ≠ substituto também é aplicada durante a importação.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
