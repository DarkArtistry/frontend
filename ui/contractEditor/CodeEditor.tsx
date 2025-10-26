import React, { useCallback, useRef } from 'react';
import { Box, Flex, Text, HStack } from '@chakra-ui/react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

import type { ContractFile } from 'lib/contractEditor/storage';
import { useColorMode, useColorModeValue } from 'toolkit/chakra/color-mode';

interface CodeEditorProps {
  files: Array<ContractFile>;
  activeFileId?: string;
  onFileChange: (fileId: string, content: string) => void;
  onFileSave?: (fileId: string) => void;
  compilerErrors?: Array<{ line: number; message: string; severity: 'error' | 'warning' }>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFileId,
  onFileChange,
  onFileSave,
  compilerErrors = [],
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { colorMode } = useColorMode();
  const tabBg = useColorModeValue('gray.50', 'gray.800');
  const tabActiveBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const activeFile = files.find(f => f.id === activeFileId);

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;

    // Configure Solidity language
    monaco.languages.register({ id: 'sol' });

    // Set token provider for basic Solidity syntax highlighting
    monaco.languages.setMonarchTokensProvider('sol', {
      keywords: [
        'pragma', 'contract', 'interface', 'library', 'function', 'modifier',
        'mapping', 'address', 'uint', 'uint256', 'uint128', 'uint64', 'uint32',
        'uint16', 'uint8', 'int', 'int256', 'int128', 'int64', 'int32', 'int16',
        'int8', 'string', 'bool', 'bytes', 'bytes32', 'bytes16', 'bytes8', 'bytes4',
        'bytes2', 'bytes1', 'public', 'private', 'external', 'internal', 'payable',
        'view', 'pure', 'memory', 'storage', 'calldata', 'event', 'emit', 'constructor',
        'fallback', 'receive', 'virtual', 'override', 'constant', 'immutable', 'anonymous',
        'indexed', 'returns', 'return', 'revert', 'require', 'assert', 'if', 'else',
        'for', 'while', 'do', 'break', 'continue', 'try', 'catch', 'finally', 'new',
        'delete', 'this', 'super', 'is', 'abstract', 'enum', 'struct', 'using', 'import',
        'from', 'as', 'true', 'false', 'wei', 'gwei', 'ether', 'seconds', 'minutes',
        'hours', 'days', 'weeks', 'years',
      ],
      tokenizer: {
        root: [
          [ /[a-z_]\w*/i, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          } ],
          [ /0x[0-9a-fA-F]+/, 'number.hex' ],
          [ /\d+/, 'number' ],
          [ /"([^"\\]|\\.)*$/, 'string.invalid' ],
          [ /"/, 'string', '@string' ],
          [ /'([^'\\]|\\.)*$/, 'string.invalid' ],
          [ /'/, 'string', '@char' ],
          [ /\/\/.*$/, 'comment' ],
          [ /\/\*/, 'comment', '@comment' ],
        ],
        string: [
          [ /[^\\"]+/, 'string' ],
          [ /"/, 'string', '@pop' ],
        ],
        char: [
          [ /[^\\']+/, 'string' ],
          [ /'/, 'string', '@pop' ],
        ],
        comment: [
          [ /[^/*]+/, 'comment' ],
          [ /\*\//, 'comment', '@pop' ],
          [ /./, 'comment' ],
        ],
      },
    });

    // Save on Ctrl/Cmd + S
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeFileId && onFileSave) {
        onFileSave(activeFileId);
      }
    });

    // Add compiler error markers if any
    if (compilerErrors.length > 0 && activeFile) {
      const markers = compilerErrors.map(error => ({
        severity: error.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : monaco.MarkerSeverity.Warning,
        startLineNumber: error.line,
        startColumn: 1,
        endLineNumber: error.line,
        endColumn: 1000,
        message: error.message,
      }));
      monaco.editor.setModelMarkers(editor.getModel()!, 'solidity', markers);
    }
  }, [activeFileId, onFileSave, compilerErrors, activeFile]);

  const handleChange = useCallback((value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      onFileChange(activeFileId, value);
    }
  }, [activeFileId, onFileChange]);

  if (!activeFile) {
    return (
      <Flex align="center" justify="center" h="full">
        <Text color="gray.500">Select a file to start editing</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" h="full">
      {/* File tabs */}
      <HStack
        gap={ 0 }
        bg={ tabBg }
        borderBottom="1px solid"
        borderColor={ borderColor }
        overflowX="auto"
        css={{
          '&::-webkit-scrollbar': {
            height: '3px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '3px',
          },
        }}
      >
        { files.map((file) => (
          <Box
            key={ file.id }
            px={ 4 }
            py={ 2 }
            bg={ file.id === activeFileId ? tabActiveBg : 'transparent' }
            borderBottom={ file.id === activeFileId ? '2px solid' : '2px solid transparent' }
            borderColor={ file.id === activeFileId ? 'blue.500' : 'transparent' }
            cursor="pointer"
            whiteSpace="nowrap"
          >
            <Text fontSize="sm">{ file.name }</Text>
          </Box>
        )) }
      </HStack>

      {/* Monaco Editor */}
      <Box flex={ 1 }>
        <Editor
          height="100%"
          language="sol"
          value={ activeFile.content }
          onChange={ handleChange }
          onMount={ handleEditorDidMount }
          theme={ colorMode === 'dark' ? 'vs-dark' : 'light' }
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </Box>
    </Flex>
  );
};

export default CodeEditor;