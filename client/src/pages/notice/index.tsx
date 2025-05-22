import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import QuestionnaireTab from "@/components/notice/QuestionnaireTab";
import PreviewTab from "@/components/notice/PreviewTab";
import TranslationTab from "@/components/notice/TranslationTab";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function NoticeModule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("questionnaire");
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const [noticeData, setNoticeData] = useState<any>(null);
  const [createdNotice, setCreatedNotice] = useState<any>(null);
  
  // Create notice mutation
  const createNoticeMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(
        "POST", 
        `/api/organizations/${user?.organizationId}/notices`, 
        data
      ),
    onSuccess: async (response) => {
      const data = await response.json();
      setCreatedNotice(data);
      setActiveTab("translation");
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${user?.organizationId}/notices`] });
      toast({
        title: "Success",
        description: "Notice created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create notice: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle next from questionnaire
  const handleQuestionnaireNext = (data: any) => {
    setQuestionnaireData(data);
    setActiveTab("preview");
  };
  
  // Handle next from preview
  const handlePreviewNext = (data: any) => {
    setNoticeData(data);
    
    // Create notice
    createNoticeMutation.mutate({
      noticeName: data.noticeName,
      noticeBody: data.noticeBody,
      noticeType: data.noticeType,
      selectedQuestionnaireData: JSON.stringify(questionnaireData),
      baseTemplateId: data.selectedTemplateId
    });
  };
  
  // Handle previous navigation
  const handlePrevious = () => {
    if (activeTab === "preview") {
      setActiveTab("questionnaire");
    } else if (activeTab === "translation") {
      setActiveTab("preview");
    }
  };
  
  // Handle completion
  const handleComplete = () => {
    toast({
      title: "Process Complete",
      description: "Your notice and translations have been saved successfully",
    });
    
    // Reset form
    setQuestionnaireData(null);
    setNoticeData(null);
    setCreatedNotice(null);
    setActiveTab("questionnaire");
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-neutral-800">
              Notice Module
            </h1>
            <p className="text-neutral-600 mt-1">
              Create and manage privacy notices for your organization.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button 
              className="bg-primary-500 text-white rounded-md font-medium flex items-center shadow-sm hover:bg-primary-600 transition"
              onClick={() => {
                setQuestionnaireData(null);
                setNoticeData(null);
                setCreatedNotice(null);
                setActiveTab("questionnaire");
              }}
            >
              <span className="material-icons text-sm mr-2">add</span>
              <span>Create Notice</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Card className="border border-neutral-200 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border-b border-neutral-200 w-full h-auto rounded-none gap-0">
            <TabsTrigger
              value="questionnaire"
              className="px-6 py-3 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
              disabled={activeTab === "translation" && createdNotice !== null}
            >
              Questionnaire
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="px-6 py-3 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
              disabled={!questionnaireData || (activeTab === "translation" && createdNotice !== null)}
            >
              Notice Type & Preview
            </TabsTrigger>
            <TabsTrigger
              value="translation"
              className="px-6 py-3 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
              disabled={!createdNotice}
            >
              Translation
            </TabsTrigger>
          </TabsList>
          
          <CardContent className="p-6">
            <TabsContent value="questionnaire" className="m-0">
              <QuestionnaireTab onNext={handleQuestionnaireNext} />
            </TabsContent>
            
            <TabsContent value="preview" className="m-0">
              {questionnaireData && (
                <PreviewTab 
                  questionnaireData={questionnaireData} 
                  onNext={handlePreviewNext}
                  onPrevious={handlePrevious}
                />
              )}
            </TabsContent>
            
            <TabsContent value="translation" className="m-0">
              {createdNotice && (
                <TranslationTab 
                  noticeData={createdNotice}
                  onPrevious={handlePrevious}
                  onComplete={handleComplete}
                />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
