import { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TranslationTabProps {
  noticeId: number;
  noticeContent: string;
}

interface Language {
  code: string;
  name: string;
  fullCode?: string;
}

interface TranslationService {
  id: string;
  name: string;
}

interface Translation {
  id: number;
  noticeId: number;
  language: string;
  translatedBody: string;
  filePath: string | null;
  createdOn: string;
}

const TranslationTab = ({ noticeId, noticeContent }: TranslationTabProps) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translationService, setTranslationService] = useState<string>("google");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationInProgress, setTranslationInProgress] = useState<{[key: string]: boolean}>({});
  const queryClient = useQueryClient();

  // Fetch supported languages
  const { data: supportedData, isLoading: isLoadingSupported } = useQuery({ 
    queryKey: ['/api/translations/languages'],
    queryFn: async () => {
      const response = await fetch('/api/translations/languages');
      if (!response.ok) {
        throw new Error('Failed to fetch supported languages');
      }
      return response.json();
    }
  });

  // Fetch existing translations
  const { data: existingTranslations, isLoading: isLoadingTranslations } = useQuery({ 
    queryKey: ['/api/translations/notice', noticeId],
    queryFn: async () => {
      const response = await fetch(`/api/translations/notice/${noticeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch existing translations');
      }
      return response.json();
    }
  });

  // Translation mutation
  const translateMutation = useMutation({
    mutationFn: async ({ language }: { language: string }) => {
      setTranslationInProgress(prev => ({ ...prev, [language]: true }));
      
      const response = await fetch('/api/translations/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noticeId,
          targetLanguage: language,
          translationService
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to translate notice');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/translations/notice', noticeId] });
    },
    onError: (error) => {
      toast({
        title: 'Translation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: (_, __, { language }) => {
      setTranslationInProgress(prev => ({ ...prev, [language]: false }));
    }
  });

  // Check for model availability
  const { data: modelAvailability } = useQuery({ 
    queryKey: ['/api/translations/model-status'],
    queryFn: async () => {
      const response = await fetch('/api/translations/model-status');
      if (!response.ok) {
        throw new Error('Failed to check model availability');
      }
      return response.json();
    }
  });

  // Handle language selection
  const toggleLanguage = (languageCode: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageCode)) {
        return prev.filter(lang => lang !== languageCode);
      } else {
        return [...prev, languageCode];
      }
    });
  };

  // Handle "Select All" checkbox
  const toggleSelectAll = () => {
    if (supportedData?.languages) {
      if (selectedLanguages.length === supportedData.languages.length) {
        setSelectedLanguages([]);
      } else {
        setSelectedLanguages(supportedData.languages.map((lang: Language) => lang.code));
      }
    }
  };

  // Handle translation
  const handleTranslate = async () => {
    if (selectedLanguages.length === 0) {
      toast({
        title: 'No Languages Selected',
        description: 'Please select at least one language for translation.',
        variant: 'destructive',
      });
      return;
    }

    setIsTranslating(true);
    
    try {
      // Translate to each selected language sequentially
      for (const language of selectedLanguages) {
        // Skip languages that already have translations
        const hasTranslation = existingTranslations?.some(
          (t: Translation) => t.language === language
        );
        
        if (!hasTranslation) {
          await translateMutation.mutateAsync({ language });
        }
      }
      
      toast({
        title: 'Translation Complete',
        description: 'All selected languages have been translated successfully.',
      });
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Function to check if a language has been translated
  const isLanguageTranslated = (languageCode: string) => {
    return existingTranslations?.some((t: Translation) => t.language === languageCode);
  };

  if (isLoadingSupported || isLoadingTranslations) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3">Loading translation options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium">Translate your notice into multiple languages using your preferred translation service.</h3>
        <p className="text-sm text-muted-foreground">
          Select the languages and translation service below to generate translated versions of your notice.
        </p>
      </div>

      {/* Translation Service Selection */}
      <div>
        <h4 className="text-base font-medium mb-3">Select Translation Service</h4>
        <RadioGroup
          value={translationService}
          onValueChange={setTranslationService}
          className="flex flex-col space-y-1"
        >
          {supportedData?.services?.map((service: TranslationService) => (
            <div key={service.id} className="flex items-center space-x-2">
              <RadioGroupItem value={service.id} id={`service-${service.id}`} />
              <Label htmlFor={`service-${service.id}`} className="cursor-pointer">
                {service.name}
                {service.id === 'indictrans2' && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                    {modelAvailability?.modelsReady ? 'Ready' : 'Requires Download'}
                  </span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Original Document */}
      <div>
        <h4 className="text-base font-medium mb-2">Original Document</h4>
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="mb-1 text-sm font-medium">English</div>
            <div className="max-h-24 overflow-y-auto text-sm border p-2 rounded bg-white">
              {noticeContent.substring(0, 300)}
              {noticeContent.length > 300 && '...'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Selection */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-base font-medium">Select Languages for Translation</h4>
          <div className="flex items-center">
            <Checkbox 
              id="select-all" 
              checked={selectedLanguages.length === supportedData?.languages?.length}
              onCheckedChange={toggleSelectAll}
            />
            <Label htmlFor="select-all" className="ml-2 cursor-pointer">Select All</Label>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {supportedData?.languages?.map((language: Language) => {
            const isTranslated = isLanguageTranslated(language.code);
            const isInProgress = translationInProgress[language.code];
            
            return (
              <div key={language.code} className="relative">
                <div className={`flex items-center space-x-2 border rounded p-2 ${isTranslated ? 'bg-green-50 border-green-200' : ''}`}>
                  <Checkbox
                    id={`lang-${language.code}`}
                    checked={selectedLanguages.includes(language.code) || isTranslated}
                    onCheckedChange={() => !isTranslated && toggleLanguage(language.code)}
                    disabled={isTranslated || isInProgress}
                  />
                  <Label
                    htmlFor={`lang-${language.code}`}
                    className={`cursor-pointer text-sm ${isTranslated ? 'text-green-700' : ''}`}
                  >
                    {language.name}
                  </Label>
                  
                  {isTranslated && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                  
                  {isInProgress && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          <span className="font-medium">Note:</span> Translations may take a few moments to complete depending on the selected service.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <Button
          onClick={handleTranslate}
          disabled={isTranslating || selectedLanguages.length === 0}
          className="min-w-[150px]"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            'Translate'
          )}
        </Button>
      </div>

      {/* Show Existing Translations */}
      {existingTranslations && existingTranslations.length > 0 && (
        <div className="mt-8">
          <h4 className="text-base font-medium mb-3">Existing Translations</h4>
          <div className="grid gap-4 md:grid-cols-2">
            {existingTranslations.map((translation: Translation) => {
              const languageName = supportedData?.languages?.find(
                (l: Language) => l.code === translation.language
              )?.name || translation.language;
              
              return (
                <Card key={translation.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-slate-100 p-3 font-medium flex justify-between items-center">
                      <span>{languageName}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(translation.createdOn).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="p-3 max-h-32 overflow-y-auto text-sm">
                      {translation.translatedBody.substring(0, 200)}
                      {translation.translatedBody.length > 200 && '...'}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Download Section - Only show if using IndicTrans2 and models aren't ready */}
      {translationService === 'indictrans2' && modelAvailability && !modelAvailability.modelsReady && (
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Model Download Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  The IndicTrans2 models need to be downloaded before you can use this translation service.
                  This is a one-time process that requires approximately 4.5GB of storage space.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  onClick={() => {
                    // This would trigger the model download process
                    fetch('/api/translations/download-models', {
                      method: 'POST'
                    }).then(response => {
                      if (response.ok) {
                        toast({
                          title: 'Download Started',
                          description: 'The translation models are being downloaded. This may take some time.',
                        });
                      } else {
                        toast({
                          title: 'Download Failed',
                          description: 'Failed to start model download. Please try again later.',
                          variant: 'destructive',
                        });
                      }
                    });
                  }}
                >
                  Download Models
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TranslationTab;