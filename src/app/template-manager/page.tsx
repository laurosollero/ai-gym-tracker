'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { templateRepository, exerciseRepository } from '@/lib/db/repositories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Upload, FileText, Share, AlertTriangle, CheckCircle, FolderDown, Package } from 'lucide-react';
import type { WorkoutTemplate, TemplateExercise, Exercise } from '@/lib/types';
import Link from 'next/link';

interface TemplateExportData {
  template: Omit<WorkoutTemplate, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    muscles: string[];
    equipment?: string;
  }>;
  exportedAt: string;
  exportedBy: string;
  version: string;
}

interface ImportResult {
  success: boolean;
  template?: WorkoutTemplate;
  errors?: string[];
  warnings?: string[];
}

export default function TemplateManagerPage() {
  const { user } = useAppStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [isExportingAll, setIsExportingAll] = useState(false);

  // Load user templates
  const loadTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const userTemplates = await templateRepository.getUserTemplates(user.id);
      setTemplates(userTemplates.filter(t => !t.isBuiltIn)); // Only custom templates
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, [user]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTemplate = async (templateId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const template = await templateRepository.getTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Get exercise details for all exercises in the template
      const exerciseDetails: Array<{
        exerciseId: string;
        exerciseName: string;
        muscles: string[];
        equipment?: string;
      }> = [];

      for (const templateExercise of template.exercises) {
        try {
          const exercise = await exerciseRepository.getExerciseById(templateExercise.exerciseId);
          if (exercise) {
            exerciseDetails.push({
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              muscles: exercise.muscles,
              equipment: exercise.equipment,
            });
          } else {
            // Fallback to template exercise name if exercise not found
            exerciseDetails.push({
              exerciseId: templateExercise.exerciseId,
              exerciseName: templateExercise.exerciseName,
              muscles: [],
              equipment: undefined,
            });
          }
        } catch (error) {
          console.warn(`Failed to load exercise ${templateExercise.exerciseId}:`, error);
          exerciseDetails.push({
            exerciseId: templateExercise.exerciseId,
            exerciseName: templateExercise.exerciseName,
            muscles: [],
            equipment: undefined,
          });
        }
      }

      const exportData: TemplateExportData = {
        template: {
          name: template.name,
          description: template.description,
          category: template.category,
          difficulty: template.difficulty,
          estimatedDuration: template.estimatedDuration,
          exercises: template.exercises,
          tags: template.tags,
          isBuiltIn: false, // Exported templates are never built-in
          createdFromSessionId: template.createdFromSessionId,
        },
        exercises: exerciseDetails,
        exportedAt: new Date().toISOString(),
        exportedBy: user.displayName,
        version: '1.0.0',
      };

      const json = JSON.stringify(exportData, null, 2);
      const filename = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`;
      
      downloadFile(json, filename, 'application/json');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateImportData = (data: TemplateExportData): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if it's a valid template export
    if (!data.template) {
      errors.push('Invalid file format: missing template data');
      return { isValid: false, errors, warnings };
    }

    const template = data.template;

    // Validate required fields
    if (!template.name || typeof template.name !== 'string') {
      errors.push('Template must have a valid name');
    }

    if (!template.category) {
      errors.push('Template must have a category');
    }

    if (!template.difficulty) {
      errors.push('Template must have a difficulty level');
    }

    if (!Array.isArray(template.exercises) || template.exercises.length === 0) {
      errors.push('Template must have at least one exercise');
    }

    // Validate exercises
    if (template.exercises) {
      template.exercises.forEach((exercise: TemplateExercise, index: number) => {
        if (!exercise.exerciseName) {
          errors.push(`Exercise ${index + 1} is missing a name`);
        }
        if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
          warnings.push(`Exercise "${exercise.exerciseName || index + 1}" has no sets defined`);
        }
      });
    }

    // Check for potential conflicts
    const existingTemplate = templates.find(t => t.name === template.name);
    if (existingTemplate) {
      warnings.push(`A template named "${template.name}" already exists. Import will create a copy with a modified name.`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  };

  const importTemplate = async (file: File) => {
    if (!user) return;

    setIsLoading(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const validation = validateImportData(data);
      
      if (!validation.isValid) {
        setImportResult({
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        });
        return;
      }

      // Prepare template for import
      let templateName = data.template.name;
      
      // Handle name conflicts
      const existingTemplate = templates.find(t => t.name === templateName);
      if (existingTemplate) {
        templateName = `${templateName} (Imported)`;
        let counter = 1;
        while (templates.find(t => t.name === templateName)) {
          templateName = `${data.template.name} (Imported ${counter})`;
          counter++;
        }
      }

      // Create exercises that don't exist
      const exerciseMap = new Map<string, string>(); // old ID -> new ID
      
      for (const exportedExercise of data.exercises || []) {
        try {
          // Try to find existing exercise by name
          const searchResults = await exerciseRepository.searchExercises(exportedExercise.exerciseName);
          const existingExercise = searchResults.find(ex => ex.name.toLowerCase() === exportedExercise.exerciseName.toLowerCase());
          
          if (existingExercise) {
            exerciseMap.set(exportedExercise.exerciseId, existingExercise.id);
          } else {
            // Create new exercise
            const newExercise: Omit<Exercise, 'createdAt' | 'updatedAt'> = {
              id: crypto.randomUUID(),
              name: exportedExercise.exerciseName,
              muscles: exportedExercise.muscles || [],
              equipment: exportedExercise.equipment,
              isCustom: true,
              ownerId: user.id,
              notes: 'Imported with template',
            };
            
            const createdExercise = await exerciseRepository.createExercise(newExercise);
            exerciseMap.set(exportedExercise.exerciseId, createdExercise.id);
          }
        } catch (error) {
          console.warn(`Failed to process exercise ${exportedExercise.exerciseName}:`, error);
          // Continue with template import even if some exercises fail
        }
      }

      // Update exercise references in template
      const updatedExercises: TemplateExercise[] = data.template.exercises.map((exercise: TemplateExercise) => ({
        ...exercise,
        id: crypto.randomUUID(),
        exerciseId: exerciseMap.get(exercise.exerciseId) || exercise.exerciseId,
        sets: exercise.sets.map((set) => ({
          ...set,
          id: crypto.randomUUID(),
        })),
      }));

      // Create template
      const newTemplate: Omit<WorkoutTemplate, 'createdAt' | 'updatedAt'> = {
        id: crypto.randomUUID(),
        name: templateName,
        description: data.template.description || 'Imported template',
        category: data.template.category || 'custom',
        difficulty: data.template.difficulty || 'intermediate',
        estimatedDuration: data.template.estimatedDuration || 60,
        exercises: updatedExercises,
        tags: data.template.tags || [],
        isBuiltIn: false,
        ownerId: user.id,
        createdFromSessionId: undefined,
      };

      const createdTemplate = await templateRepository.createTemplate(newTemplate);

      setImportResult({
        success: true,
        template: createdTemplate,
        warnings: validation.warnings,
      });

      // Refresh templates list
      await loadTemplates();

    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        errors: ['Failed to parse file. Please ensure it\'s a valid template export file.'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importTemplate(file);
    }
  };

  const handleTemplateToggle = (templateId: string) => {
    const newSelected = new Set(selectedTemplateIds);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplateIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTemplateIds.size === templates.length) {
      setSelectedTemplateIds(new Set());
    } else {
      setSelectedTemplateIds(new Set(templates.map(t => t.id)));
    }
  };

  const exportSelectedTemplates = async () => {
    if (selectedTemplateIds.size === 0) return;

    setIsExportingAll(true);
    try {
      const selectedTemplates = templates.filter(t => selectedTemplateIds.has(t.id));
      const exportData = [];

      for (const template of selectedTemplates) {
        // Get exercise details for each template
        const exerciseDetails: Array<{
          exerciseId: string;
          exerciseName: string;
          muscles: string[];
          equipment?: string;
        }> = [];

        for (const templateExercise of template.exercises) {
          try {
            const exercise = await exerciseRepository.getExerciseById(templateExercise.exerciseId);
            if (exercise) {
              exerciseDetails.push({
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                muscles: exercise.muscles,
                equipment: exercise.equipment,
              });
            } else {
              exerciseDetails.push({
                exerciseId: templateExercise.exerciseId,
                exerciseName: templateExercise.exerciseName,
                muscles: [],
                equipment: undefined,
              });
            }
          } catch (error) {
            console.warn(`Failed to load exercise ${templateExercise.exerciseId}:`, error);
            exerciseDetails.push({
              exerciseId: templateExercise.exerciseId,
              exerciseName: templateExercise.exerciseName,
              muscles: [],
              equipment: undefined,
            });
          }
        }

        const templateExportData: TemplateExportData = {
          template: {
            name: template.name,
            description: template.description,
            category: template.category,
            difficulty: template.difficulty,
            estimatedDuration: template.estimatedDuration,
            exercises: template.exercises,
            tags: template.tags,
            isBuiltIn: false,
            createdFromSessionId: template.createdFromSessionId,
          },
          exercises: exerciseDetails,
          exportedAt: new Date().toISOString(),
          exportedBy: user?.displayName || 'Unknown',
          version: '1.0.0',
        };

        exportData.push(templateExportData);
      }

      const bulkExportData = {
        templates: exportData,
        exportedAt: new Date().toISOString(),
        exportedBy: user?.displayName || 'Unknown',
        version: '1.0.0',
        count: exportData.length,
      };

      const json = JSON.stringify(bulkExportData, null, 2);
      const filename = `gym_tracker_templates_${selectedTemplates.length}_${new Date().toISOString().split('T')[0]}.json`;
      
      downloadFile(json, filename, 'application/json');
    } catch (error) {
      console.error('Bulk export failed:', error);
    } finally {
      setIsExportingAll(false);
    }
  };

  const exportAllTemplates = async () => {
    if (templates.length === 0) return;
    
    // Select all templates and export
    setSelectedTemplateIds(new Set(templates.map(t => t.id)));
    setTimeout(() => {
      exportSelectedTemplates();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Template Manager</h1>
            <p className="text-muted-foreground">Import and export workout templates</p>
          </div>
        </header>

        <Tabs defaultValue="export" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export">Single Export</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Template
                </CardTitle>
                <CardDescription>
                  Share your custom workout templates with others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {templates.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <Label>Select Template to Export</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                      >
                        <option value="">Choose a template...</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.exercises.length} exercises)
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      onClick={() => exportTemplate(selectedTemplate)}
                      disabled={!selectedTemplate || isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export Template
                        </>
                      )}
                    </Button>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-start gap-2">
                        <Share className="h-4 w-4 mt-0.5 text-blue-500" />
                        <div className="text-sm">
                          <p className="font-medium">Sharing Templates</p>
                          <p className="text-muted-foreground">
                            Exported templates include exercise definitions and can be shared with other users. 
                            Recipients can import them directly into their template library.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No custom templates found</p>
                    <p className="text-sm text-muted-foreground">
                      Create some custom templates first to export them
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Operations Tab */}
          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Bulk Template Operations
                </CardTitle>
                <CardDescription>
                  Export multiple templates at once or import template collections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {templates.length > 0 ? (
                  <>
                    {/* Quick Actions */}
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        onClick={exportAllTemplates}
                        disabled={isExportingAll}
                        variant="outline"
                      >
                        {isExportingAll ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Exporting...
                          </>
                        ) : (
                          <>
                            <FolderDown className="h-4 w-4 mr-2" />
                            Export All ({templates.length})
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleSelectAll}
                        variant="outline"
                      >
                        {selectedTemplateIds.size === templates.length ? 'Deselect All' : 'Select All'}
                      </Button>

                      {selectedTemplateIds.size > 0 && (
                        <Button
                          onClick={exportSelectedTemplates}
                          disabled={isExportingAll}
                        >
                          {isExportingAll ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Export Selected ({selectedTemplateIds.size})
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Template Selection List */}
                    <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                      {templates.map((template) => (
                        <div key={template.id} className="p-3 flex items-center gap-3 hover:bg-muted/50">
                          <input
                            type="checkbox"
                            checked={selectedTemplateIds.has(template.id)}
                            onChange={() => handleTemplateToggle(template.id)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {template.exercises.length} exercises • {template.category} • {template.difficulty}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {template.estimatedDuration}min
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 mt-0.5 text-blue-500" />
                        <div className="text-sm">
                          <p className="font-medium">Bulk Export Benefits</p>
                          <p className="text-muted-foreground">
                            Export multiple templates in one file for easy sharing with coaching clients, 
                            backup purposes, or transferring between devices.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No templates available for bulk operations</p>
                    <p className="text-sm text-muted-foreground">
                      Create some custom templates first to use bulk features
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Template
                </CardTitle>
                <CardDescription>
                  Import workout templates from files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Template File</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      Choose File
                    </Button>
                  </div>
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Processing template...</span>
                  </div>
                )}

                {importResult && (
                  <div className={`p-4 rounded-lg border ${
                    importResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {importResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          importResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {importResult.success ? 'Import Successful!' : 'Import Failed'}
                        </h4>
                        
                        {importResult.template && (
                          <p className="text-sm text-green-700 mt-1">
                            Template &quot;{importResult.template.name}&quot; has been added to your library.
                          </p>
                        )}

                        {importResult.errors && importResult.errors.length > 0 && (
                          <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                            {importResult.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        )}

                        {importResult.warnings && importResult.warnings.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-yellow-800">Warnings:</p>
                            <ul className="text-sm text-yellow-700 list-disc list-inside">
                              {importResult.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-blue-500" />
                    <div className="text-sm">
                      <p className="font-medium">Supported Formats</p>
                      <p className="text-muted-foreground">
                        Import JSON files exported from this app. Missing exercises will be created automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}