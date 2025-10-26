import React, { useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  VStack,
  HStack,
  Button,
} from '@chakra-ui/react';
import { FiFile, FiFolder, FiFolderPlus, FiFilePlus, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';
import { IconButton } from 'toolkit/chakra/icon-button';
import { useColorModeValue } from 'toolkit/chakra/color-mode';
import {
  DialogContent,
  DialogRoot,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
} from 'toolkit/chakra/dialog';

import type { ContractFile } from 'lib/contractEditor/storage';

interface FileTreeProps {
  files: Array<ContractFile>;
  activeFileId?: string;
  onFileSelect: (fileId: string) => void;
  onFileCreate: (fileName: string) => void;
  onFileRename: (fileId: string, newName: string) => void;
  onFileDelete: (fileId: string) => void;
  onFileUpdate?: (fileId: string, content: string) => void;
}

const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFileId,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
  onFileUpdate,
}) => {
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const bgHover = useColorModeValue('gray.100', 'gray.700');
  const bgActive = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleCreateFile = useCallback(() => {
    if (newFileName.trim()) {
      const fileName = newFileName.endsWith('.sol') ? newFileName : `${newFileName}.sol`;
      onFileCreate(fileName);
      setNewFileName('');
      setIsNewFileOpen(false);
    }
  }, [newFileName, onFileCreate]);

  const handleRename = useCallback((fileId: string) => {
    if (editingName.trim() && editingName !== files.find(f => f.id === fileId)?.name) {
      const fileName = editingName.endsWith('.sol') ? editingName : `${editingName}.sol`;
      onFileRename(fileId, fileName);
    }
    setEditingFileId(null);
    setEditingName('');
  }, [editingName, files, onFileRename]);

  const startRename = useCallback((e: React.MouseEvent, fileId: string, currentName: string) => {
    e.stopPropagation();
    setEditingFileId(fileId);
    setEditingName(currentName);
  }, []);

  const confirmDelete = useCallback((e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    setFileToDelete(fileId);
    setIsDeleteOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (fileToDelete) {
      onFileDelete(fileToDelete);
      setFileToDelete(null);
      setIsDeleteOpen(false);
    }
  }, [fileToDelete, onFileDelete]);

  const loadTemplate = useCallback((templateName: string) => {
    let content = '';
    let fileName = '';
    
    if (templateName === 'usdc') {
      fileName = 'USDC.sol';
      content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract USDC is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    ERC20PermitUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Blacklist mapping
    mapping(address => bool) private _blacklisted;

    // Events
    event Blacklisted(address indexed account);
    event UnBlacklisted(address indexed account);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     * @param defaultAdmin Admin who can grant roles
     * @param minter Initial minter
     * @param pauser Initial pauser  
     * @param blacklister Initial blacklister
     * @param upgrader Initial upgrader
     */
    function initialize(
        address defaultAdmin,
        address minter,
        address pauser,
        address blacklister,
        address upgrader
    ) public initializer {
        __ERC20_init("USD Coin", "USDC");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __ERC20Permit_init("USD Coin");
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(BLACKLISTER_ROLE, blacklister);
        _grantRole(UPGRADER_ROLE, upgrader);
    }
    
    // Override decimals to return 6 (like real USDC)
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    // Modifiers
    modifier notBlacklisted(address account) {
        require(!_blacklisted[account], "USDC: account is blacklisted");
        _;
    }
    
    // === BLACKLIST FUNCTIONS ===
    function blacklist(address account) external onlyRole(BLACKLISTER_ROLE) {
        require(account != address(0), "USDC: zero address");
        require(!_blacklisted[account], "USDC: already blacklisted");
        _blacklisted[account] = true;
        emit Blacklisted(account);
    }

    function unBlacklist(address account) external onlyRole(BLACKLISTER_ROLE) {
        require(_blacklisted[account], "USDC: not blacklisted");
        _blacklisted[account] = false;
        emit UnBlacklisted(account);
    }

    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }

    // === MINT ===
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // === PAUSE ===
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // === HOOKS ===
    function _update(
        address from,
        address to,
        uint256 amount
    )
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
        notBlacklisted(from)
        notBlacklisted(to)
    {
        super._update(from, to, amount);
    }

    // === UPGRADE AUTHORIZATION ===
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
}`;
    } else if (templateName === 'simple-erc20') {
      fileName = 'MyToken.sol';
      content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev Simple ERC20 Token with minting and burning capabilities
 */
contract MyToken is ERC20, ERC20Burnable, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Mint new tokens
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Returns the number of decimals used for token amounts
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}`;
    } else if (templateName === 'hello-world') {
      fileName = 'HelloWorld.sol';
      content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HelloWorld
 * @dev Simple contract to test compilation without external dependencies
 */
contract HelloWorld {
    string public greeting = "Hello World!";
    address public owner;
    uint256 public counter;
    
    event GreetingChanged(string oldGreeting, string newGreeting);
    event CounterIncremented(uint256 newValue);
    
    constructor() {
        owner = msg.sender;
        counter = 0;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    /**
     * @dev Change the greeting message
     * @param _newGreeting The new greeting to set
     */
    function setGreeting(string memory _newGreeting) public onlyOwner {
        string memory oldGreeting = greeting;
        greeting = _newGreeting;
        emit GreetingChanged(oldGreeting, _newGreeting);
    }
    
    /**
     * @dev Increment the counter
     */
    function incrementCounter() public {
        counter++;
        emit CounterIncremented(counter);
    }
    
    /**
     * @dev Get the current greeting
     * @return The current greeting message
     */
    function getGreeting() public view returns (string memory) {
        return greeting;
    }
    
    /**
     * @dev Transfer ownership to a new address
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}`;
    }
    
    if (fileName && content) {
      // Create the file
      onFileCreate(fileName);
      
      // After file is created, update its content and select it
      setTimeout(() => {
        const newFile = files.find(f => f.name === fileName);
        if (newFile && onFileUpdate) {
          onFileUpdate(newFile.id, content);
          onFileSelect(newFile.id);
        }
      }, 100);
      
      setIsTemplateOpen(false);
    }
  }, [files, onFileCreate, onFileSelect, onFileUpdate]);

  return (
    <VStack align="stretch" gap={ 2 }>
      <Flex justify="space-between" align="center" mb={ 2 }>
        <Text fontSize="sm" fontWeight="bold">Files</Text>
        <HStack gap={ 1 }>
          <IconButton
            aria-label="Load template"
            size="2xs"
            variant="ghost"
            onClick={ () => setIsTemplateOpen(true) }
          >
            <FiFileText/>
          </IconButton>
          <IconButton
            aria-label="New file"
            size="2xs"
            variant="ghost"
            onClick={ () => setIsNewFileOpen(true) }
          >
            <FiFilePlus/>
          </IconButton>
        </HStack>
      </Flex>

      <VStack align="stretch" gap={ 1 }>
        { files.length === 0 ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={ 4 }>
            No files yet. Create your first contract!
          </Text>
        ) : (
          files.map((file) => (
            <Flex
              key={ file.id }
              align="center"
              px={ 2 }
              py={ 1 }
              cursor="pointer"
              borderRadius="md"
              bg={ activeFileId === file.id ? bgActive : 'transparent' }
              _hover={{ bg: activeFileId === file.id ? bgActive : bgHover, '& .file-actions': { opacity: 1 } }}
              onClick={() => onFileSelect(file.id)}
              position="relative"
            >
              <FiFile size={ 14 } style={{ marginRight: '8px', flexShrink: 0 }}/>
              
              { editingFileId === file.id ? (
                <Input
                  size="sm"
                  value={ editingName }
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleRename(file.id)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRename(file.id);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <>
                  <Text fontSize="sm" flex={ 1 } truncate>
                    { file.name }
                  </Text>
                  <HStack
                    gap={ 1 }
                    className="file-actions"
                    opacity={ 0 }
                    transition="opacity 0.2s"
                  >
                    <IconButton
                      aria-label="Rename"
                      size="2xs"
                      variant="ghost"
                      onClick={(e) => startRename(e, file.id, file.name)}
                    >
                      <FiEdit2/>
                    </IconButton>
                    <IconButton
                      aria-label="Delete"
                      size="2xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => confirmDelete(e, file.id)}
                      disabled={ files.length === 1 }
                    >
                      <FiTrash2/>
                    </IconButton>
                  </HStack>
                </>
              )}
            </Flex>
          ))
        )}
      </VStack>

      {/* New File Dialog */}
      <DialogRoot open={ isNewFileOpen } onOpenChange={ (details) => setIsNewFileOpen(details.open) }>
        <DialogContent>
          <DialogHeader>Create New File</DialogHeader>
          <DialogCloseTrigger/>
          <DialogBody>
            <Input
              placeholder="Enter file name (e.g., MyContract.sol)"
              value={ newFileName }
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                }
              }}
              autoFocus
            />
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost" mr={ 3 }>Cancel</Button>
            </DialogActionTrigger>
            <Button colorScheme="blue" onClick={ handleCreateFile }>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={ isDeleteOpen } onOpenChange={ (details) => setIsDeleteOpen(details.open) }>
        <DialogContent>
          <DialogHeader>Delete File</DialogHeader>
          <DialogCloseTrigger/>
          <DialogBody>
            Are you sure you want to delete this file? This action cannot be undone.
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost" mr={ 3 }>Cancel</Button>
            </DialogActionTrigger>
            <Button colorScheme="red" onClick={ handleDelete }>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Template Selection Dialog */}
      <DialogRoot open={ isTemplateOpen } onOpenChange={ (details) => setIsTemplateOpen(details.open) }>
        <DialogContent>
          <DialogHeader>Load Contract Template</DialogHeader>
          <DialogCloseTrigger/>
          <DialogBody>
            <VStack align="stretch" gap={ 3 }>
              <Text fontSize="sm">Select a contract template to get started:</Text>
              <Button
                size="sm"
                variant="outline"
                onClick={ () => loadTemplate('usdc') }
                justifyContent="flex-start"
              >
                <VStack align="flex-start" gap={ 0 }>
                  <Text fontWeight="bold">USDC Stablecoin (Upgradeable)</Text>
                  <Text fontSize="xs" color="gray.600">Full USDC implementation with proxy upgradeability</Text>
                </VStack>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={ () => loadTemplate('simple-erc20') }
                justifyContent="flex-start"
              >
                <VStack align="flex-start" gap={ 0 }>
                  <Text fontWeight="bold">Simple ERC20 Token</Text>
                  <Text fontSize="xs" color="gray.600">Basic ERC20 with minting and burning</Text>
                </VStack>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={ () => loadTemplate('hello-world') }
                justifyContent="flex-start"
              >
                <VStack align="flex-start" gap={ 0 }>
                  <Text fontWeight="bold">Hello World</Text>
                  <Text fontSize="xs" color="gray.600">Simple contract to test compilation</Text>
                </VStack>
              </Button>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
};

export default FileTree;