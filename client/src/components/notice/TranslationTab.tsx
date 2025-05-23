import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

interface TranslationTabProps {
  noticeData: any;
  onPrevious: () => void;
  onComplete: () => void;
}

// Language mapping for Indian languages
// Bold names indicate languages available in Google Translate
const languages = [
  { code: 'asm', name: 'Assamese', googleSupported: false },
  { code: 'ben', name: 'Bengali', googleSupported: true },
  { code: 'guj', name: 'Gujarati', googleSupported: true },
  { code: 'hin', name: 'Hindi', googleSupported: true },
  { code: 'kan', name: 'Kannada', googleSupported: true },
  { code: 'kas', name: 'Kashmiri', googleSupported: false },
  { code: 'kok', name: 'Konkani', googleSupported: false },
  { code: 'mal', name: 'Malayalam', googleSupported: true },
  { code: 'mni', name: 'Manipuri', googleSupported: false },
  { code: 'mar', name: 'Marathi', googleSupported: true },
  { code: 'nep', name: 'Nepali', googleSupported: true },
  { code: 'ori', name: 'Oriya', googleSupported: false },
  { code: 'pan', name: 'Punjabi', googleSupported: true },
  { code: 'san', name: 'Sanskrit', googleSupported: false },
  { code: 'snd', name: 'Sindhi', googleSupported: false },
  { code: 'tam', name: 'Tamil', googleSupported: true },
  { code: 'tel', name: 'Telugu', googleSupported: true },
  { code: 'urd', name: 'Urdu', googleSupported: true },
  { code: 'bod', name: 'Bodo', googleSupported: false },
  { code: 'sat', name: 'Santhali', googleSupported: false },
  { code: 'mai', name: 'Maithili', googleSupported: false },
  { code: 'doi', name: 'Dogri', googleSupported: false }
];

export default function TranslationTab({ noticeData, onPrevious, onComplete }: TranslationTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translatedNotices, setTranslatedNotices] = useState<any[]>([]);
  const [translationService, setTranslationService] = useState<'llm' | 'google'>('google');
  
  // Toggle language selection
  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };
  
  // Select/deselect all languages
  const toggleAllLanguages = () => {
    if (selectedLanguages.length === languages.length) {
      setSelectedLanguages([]);
    } else {
      setSelectedLanguages(languages.map((l) => l.code));
    }
  };
  
  // Translate notice
  const translateMutation = useMutation({
    mutationFn: (languages: string[]) => 
      apiRequest(
        "POST", 
        `/api/organizations/${user?.organizationId}/notices/${noticeData.noticeId}/translate`, 
        {
          body: JSON.stringify({
            targetLanguageCodes: languages,
            translationService: translationService
          })
        }
      ),
    onSuccess: async (response) => {
      const data = await response.json();
      setTranslatedNotices(data.translatedNotices || []);
      toast({
        title: "Success",
        description: "Notice translated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to translate notice: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Start translation process
  const handleTranslate = () => {
    if (selectedLanguages.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one language",
        variant: "destructive",
      });
      return;
    }
    
    translateMutation.mutate(selectedLanguages);
  };
  
  // Download translated notice as PDF
  const handleDownload = (translatedNotice: any) => {
    window.open(
      `/api/organizations/${user?.organizationId}/notices/${noticeData.noticeId}/translations/${translatedNotice.id}/download?format=pdf`, 
      '_blank'
    );
  };
  
  // Download translated notice as DOCX
  const handleDownloadDocx = (translatedNotice: any) => {
    window.open(
      `/api/organizations/${user?.organizationId}/notices/${noticeData.noticeId}/translations/${translatedNotice.id}/download?format=docx`, 
      '_blank'
    );
  };
  
  // Download original notice
  const handleDownloadOriginal = () => {
    window.open(
      `/api/organizations/${user?.organizationId}/notices/${noticeData.noticeId}/download`, 
      '_blank'
    );
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Translation</h3>
      <p className="text-neutral-600 mb-6">
        Translate your notice into multiple languages using your preferred translation service.
      </p>
      
      {/* Translation Service Selection */}
      <div className="mb-6">
        <Label className="mb-2 block">Select Translation Service</Label>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="google-translate"
              name="translation-service"
              value="google"
              checked={translationService === 'google'}
              onChange={() => setTranslationService('google')}
              className="h-4 w-4 text-[#2E77AE] focus:ring-[#2E77AE]"
            />
            <label htmlFor="google-translate" className="font-medium">
              Google Translate
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="llm-model"
              name="translation-service"
              value="llm"
              checked={translationService === 'llm'}
              onChange={() => setTranslationService('llm')}
              className="h-4 w-4 text-[#2E77AE] focus:ring-[#2E77AE]"
            />
            <label htmlFor="llm-model" className="font-medium">
              LLM Model (API)
            </label>
          </div>
        </div>
      </div>
      
      {/* Original Document Tile */}
      <div className="mb-6">
        <Label className="mb-2 block">Original Document</Label>
        <Card className="bg-white border border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-lg">{noticeData.noticeName || "Original Document"}</h4>
                <p className="text-neutral-500 text-sm mt-1">English</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadOriginal}
                  className="flex items-center text-[#2E77AE] border-[#2E77AE]/30 hover:bg-[#2E77AE]/10 hover:border-[#2E77AE]"
                >
                  <span className="material-icons text-sm mr-1">download</span>
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Language Selection */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Label>Select Languages for Translation</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="selectAll"
              checked={selectedLanguages.length === languages.length}
              onCheckedChange={toggleAllLanguages}
            />
            <label
              htmlFor="selectAll"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Select All
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {languages.map((language) => (
            <div key={language.code} className="flex items-center space-x-2">
              <Checkbox
                id={`lang-${language.code}`}
                checked={selectedLanguages.includes(language.code)}
                onCheckedChange={() => toggleLanguage(language.code)}
                disabled={translationService === 'google' && !language.googleSupported}
              />
              <label
                htmlFor={`lang-${language.code}`}
                className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                  language.googleSupported ? 'font-bold' : 'font-normal'
                } ${translationService === 'google' && !language.googleSupported ? 'text-gray-400' : ''}`}
              >
                {language.name}
                {translationService === 'google' && !language.googleSupported && 
                  <span className="ml-1 text-xs text-red-500">(LLM only)</span>
                }
              </label>
            </div>
          ))}
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          <p>Note: <span className="font-bold">Bold languages</span> are supported by Google Translate. All languages are supported by LLM API.</p>
        </div>
      </div>
      
      {/* Translate Button */}
      <div className="flex justify-center mb-6">
        <Button 
          className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
          onClick={handleTranslate}
          disabled={translateMutation.isPending || selectedLanguages.length === 0}
        >
          {translateMutation.isPending ? (
            <>
              <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
              Translating...
            </>
          ) : (
            <>
              <span className="material-icons mr-2 text-sm">translate</span>
              Translate
            </>
          )}
        </Button>
      </div>
      
      {/* Translated Notices */}
      {translatedNotices.length > 0 && (
        <div>
          <Label className="mb-2 block">Translated Documents</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {translatedNotices.map((notice) => (
              <Card key={notice.id} className="bg-white border border-neutral-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{noticeData.noticeName}</h4>
                      <p className="text-neutral-500 text-sm mt-1">{notice.language}</p>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(notice)}
                        className="flex items-center text-[#2E77AE] border-[#2E77AE]/30 hover:bg-[#2E77AE]/10 hover:border-[#2E77AE]"
                      >
                        <span className="material-icons text-sm mr-1">download</span>
                        PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadDocx(notice)}
                        className="flex items-center text-[#2E77AE] border-[#2E77AE]/30 hover:bg-[#2E77AE]/10 hover:border-[#2E77AE]"
                      >
                        <span className="material-icons text-sm mr-1">description</span>
                        DOCX
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={onPrevious}
          className="text-[#2E77AE] border-[#2E77AE]/30 hover:bg-[#2E77AE]/10 hover:border-[#2E77AE]"
        >
          Previous
        </Button>
        
        <Button 
          className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
          onClick={onComplete}
        >
          Complete
        </Button>
      </div>
    </div>
  );
}
