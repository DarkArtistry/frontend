import { Box, Flex, Text } from '@chakra-ui/react';
import React, { useState, useCallback, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import dynamic from 'next/dynamic';

import { useColorModeValue } from 'toolkit/chakra/color-mode';

import PageTitle from 'ui/shared/Page/PageTitle';
import { toaster } from 'toolkit/chakra/toaster';
import { ContractStorage } from 'lib/contractEditor/storage';
// import { SolidityCompiler } from 'lib/contractEditor/compiler';
// import { SimpleSolidityCompiler } from 'lib/contractEditor/simpleCompiler';
// import { InlineSolidityCompiler } from 'lib/contractEditor/inlineCompiler';
// import { RealSolidityCompiler } from 'lib/contractEditor/realCompiler';
import { WebWorkerSolidityCompiler } from 'lib/contractEditor/webWorkerCompiler';
import { useBlockscoutIntegration } from 'lib/contractEditor/blockscoutIntegration';
import FileTree from 'ui/contractEditor/FileTree';
import DeployPanel from 'ui/contractEditor/DeployPanel';

// Dynamic import for Monaco Editor to avoid SSR issues
const CodeEditor = dynamic(
  () => import('ui/contractEditor/CodeEditor'),
  { 
    ssr: false,
    loading: () => (
      <Flex align="center" justify="center" h="full">
        <Text>Loading editor...</Text>
      </Flex>
    ),
  }
);

const ContractEditor = () => {
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const blockscout = useBlockscoutIntegration();
  
  const [storage] = useState(() => ContractStorage.getInstance());
  const [compiler] = useState(() => WebWorkerSolidityCompiler.getInstance());
  
  // State
  const [projects, setProjects] = useState(storage.getAllProjects());
  const [activeProject, setActiveProject] = useState(projects[0] || storage.createProject('New Project'));
  const [compileResult, setCompileResult] = useState<any>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerErrors, setCompilerErrors] = useState<any[]>([]);
  
  // Update storage with wallet address
  useEffect(() => {
    storage.setWalletAddress(address || null);
    
    // Reload projects when wallet changes
    const updatedProjects = storage.getAllProjects();
    setProjects(updatedProjects);
    
    if (!updatedProjects.length) {
      const newProject = storage.createProject('New Project');
      setProjects([newProject]);
      setActiveProject(newProject);
    } else {
      setActiveProject(updatedProjects[0]);
    }
  }, [address, storage]);
  
  // File operations
  const handleFileSelect = useCallback((fileId: string) => {
    storage.updateProject(activeProject.id, { activeFileId: fileId });
    setActiveProject(prev => ({ ...prev, activeFileId: fileId }));
  }, [activeProject.id, storage]);
  
  const handleFileCreate = useCallback((fileName: string) => {
    const newFile = storage.addFile(activeProject.id, fileName);
    if (newFile) {
      const updated = storage.getProject(activeProject.id);
      if (updated) {
        setActiveProject(updated);
        handleFileSelect(newFile.id);
      }
    }
  }, [activeProject.id, storage, handleFileSelect]);
  
  const handleFileRename = useCallback((fileId: string, newName: string) => {
    storage.updateFile(activeProject.id, fileId, { name: newName });
    const updated = storage.getProject(activeProject.id);
    if (updated) setActiveProject(updated);
  }, [activeProject.id, storage]);
  
  const handleFileDelete = useCallback((fileId: string) => {
    storage.deleteFile(activeProject.id, fileId);
    const updated = storage.getProject(activeProject.id);
    if (updated) setActiveProject(updated);
  }, [activeProject.id, storage]);
  
  const handleFileChange = useCallback((fileId: string, content: string) => {
    storage.autoSaveFile(activeProject.id, fileId, content);
    setActiveProject(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.id === fileId ? { ...f, content } : f
      ),
    }));
  }, [activeProject.id, storage]);
  
  // Compilation
  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    setCompilerErrors([]);
    
    try {
      const sources = activeProject.files.reduce((acc, file) => {
        acc[file.name] = file.content;
        return acc;
      }, {} as Record<string, string>);
      
      const result = await compiler.compile(sources);
      setCompileResult(result);
      
      if (result.errors) {
        // Map errors to line numbers
        const errorsByFile = result.errors.reduce((acc, error) => {
          const match = error.formattedMessage.match(/(\w+\.sol):(\d+):(\d+)/);
          if (match) {
            const [, fileName, line] = match;
            const file = activeProject.files.find(f => f.name === fileName);
            if (file) {
              if (!acc[file.id]) acc[file.id] = [];
              acc[file.id].push({
                line: parseInt(line),
                message: error.formattedMessage,
                severity: error.severity,
              });
            }
          }
          return acc;
        }, {} as Record<string, any[]>);
        
        if (activeProject.activeFileId && errorsByFile[activeProject.activeFileId]) {
          setCompilerErrors(errorsByFile[activeProject.activeFileId]);
        }
      }
      
      toaster.create({
        title: result.success ? 'Compilation successful' : 'Compilation failed',
        type: result.success ? 'success' : 'error',
      });
    } catch (error: any) {
      console.error('Compilation error:', error);
      toaster.create({
        title: 'Compilation error',
        description: error.message,
        type: 'error',
      });
    } finally {
      setIsCompiling(false);
    }
  }, [activeProject, compiler]);

  return (
    <>
      <PageTitle title="Build & Deploy Smart Contract"/>
      
      <Flex
        mt={ 6 }
        height="calc(100vh - 200px)"
        bg={ bgColor }
        borderRadius="lg"
        border="1px solid"
        borderColor={ borderColor }
        overflow="hidden"
      >
        {/* File Tree Panel */}
        <Box
          width="250px"
          bg={ useColorModeValue('gray.50', 'gray.800') }
          borderRight="1px solid"
          borderColor={ borderColor }
          p={ 4 }
          overflowY="auto"
        >
          <FileTree
            files={ activeProject.files }
            activeFileId={ activeProject.activeFileId }
            onFileSelect={ handleFileSelect }
            onFileCreate={ handleFileCreate }
            onFileRename={ handleFileRename }
            onFileDelete={ handleFileDelete }
            onFileUpdate={ handleFileChange }
          />
        </Box>

        {/* Main Editor Area */}
        <Flex direction="column" flex={ 1 }>
          {/* Code Editor */}
          <Box flex={ 1 } position="relative">
            <CodeEditor
              files={ activeProject.files }
              activeFileId={ activeProject.activeFileId }
              onFileChange={ handleFileChange }
              compilerErrors={ compilerErrors }
            />
          </Box>

          {/* Compiler Output */}
          <Box
            height="150px"
            bg={ useColorModeValue('gray.50', 'gray.900') }
            borderTop="1px solid"
            borderColor={ borderColor }
            p={ 4 }
            overflowY="auto"
          >
            { compileResult ? (
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={ 2 }>
                  Compiler Output
                </Text>
                { compileResult.success ? (
                  <Text fontSize="xs" color="green.600">
                    ✓ Compilation successful - { Object.keys(compileResult.contracts || {}).length } contract(s) compiled
                  </Text>
                ) : (
                  <Box>
                    { compileResult.errors?.map((error: any, index: number) => (
                      <Text
                        key={ index }
                        fontSize="xs"
                        color={ error.severity === 'error' ? 'red.600' : 'orange.600' }
                        mb={ 1 }
                      >
                        { error.formattedMessage }
                      </Text>
                    )) }
                  </Box>
                ) }
              </Box>
            ) : (
              <Text fontSize="sm" color="gray.500">
                Compiler output will appear here
              </Text>
            ) }
          </Box>
        </Flex>

        {/* Deploy Panel */}
        <Box
          width="300px"
          bg={ useColorModeValue('gray.50', 'gray.800') }
          borderLeft="1px solid"
          borderColor={ borderColor }
          p={ 4 }
          overflowY="auto"
        >
          <DeployPanel
            compileResult={ compileResult }
            isCompiling={ isCompiling }
            onCompile={ handleCompile }
          />
        </Box>
      </Flex>
    </>
  );
};

export default ContractEditor;