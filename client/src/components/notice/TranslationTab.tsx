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

// Language mapping for Indic languages
const languages = [
  { code: 'asm_Beng', name: 'Assamese' },
  { code: 'ben_Beng', name: 'Bengali' },
  { code: 'guj_Gujr', name: 'Gujarati' },
  { code: 'hin_Deva', name: 'Hindi' },
  { code: 'kan_Knda', name: 'Kannada' },
  { code: 'mal_Mlym', name: 'Malayalam' },
  { code: 'mar_Deva', name: 'Marathi' },
  { code: 'ori_Orya', name: 'Oriya' },
  { code: 'pan_Guru', name: 'Punjabi' },
  { code: 'tam_Taml', name: 'Tamil' },
  { code: 'tel_Telu', name: 'Telugu' }
];

export default function TranslationTab({ noticeData, onPrevious, onComplete }: TranslationTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translatedNotices, setTranslatedNotices] = useState<any[]>([]);
  
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
        { targetLanguageCodes: languages }
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
  
  // Download translated notice
  const handleDownload = (translatedNotice: any) => {
    window.open(
      `/api/organizations/${user?.organizationId}/notices/${noticeData.noticeId}/translations/${translatedNotice.id}/download`, 
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
        Translate your notice into multiple languages using IndicTrans2 technology.
      </p>
      
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
                  className="flex items-center"
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
              />
              <label
                htmlFor={`lang-${language.code}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {language.name}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Translate Button */}
      <div className="flex justify-center mb-6">
        <Button 
          className="bg-primary-500 hover:bg-primary-600 text-white"
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
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(notice)}
                        className="flex items-center"
                      >
                        <span className="material-icons text-sm mr-1">download</span>
                        PDF
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
        >
          Previous
        </Button>
        
        <Button 
          className="bg-primary-500 hover:bg-primary-600 text-white"
          onClick={onComplete}
        >
          Complete
        </Button>
      </div>
    </div>
  );
}
