/*
 * Authors: Rachel Patella
 * Created: 2025-10-23
 * Updated: 2025-10-29
 *
 * This file contains functions to create the file explorer tree structure and breadcrumb trail path
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import type { Folder } from 'app/src-electron/types/shared-types';
import type { UIFolder, UINote, UIReminder } from '../types/ui-types';

export type QTreeFolder = {
  label: string;
  id: bigint;
  icon?: string;
  iconColor?: string;
  children?: QTreeFolder[];
};

// example JS nest function for how to convert flat array into n-ary nested tree from https://stackoverflow.com/questions/18017869/build-tree-array-from-flat-array-in-javascript
export function nest(items: UIFolder[], id: bigint): UIFolder[] {
  // Filter finds all folders where the parent id is equal to the current folder id
  return items.filter(item => item.parentFolderID === id)
    // For each folder, create/map new item object that includes the original folder properties ...item (id, name, parentFolderID)
    .map(item => ({
      ...item,
      // Add a children property to the item object and recursively call nest function to find children of the current folder
      children: nest(items, item.folderID)
    }));
}

// Function to convert nested folder tree to Q-Tree format
export function convertFolderTreetoQTree(folders: UIFolder[], notes: UINote[], reminders: UIReminder[]): QTreeFolder[] {
  return folders.map(folder => {
    // Find notes saved in the current folder
    const notesInCurrFolder = notes.filter(note => note.folderID === folder.folderID && note.isSaved);

    // For each note, create a QTree node with label and id properties and return it
    const noteTreeNodes = notesInCurrFolder.map((note) => {
      const itemIDBig = note.itemID;
      return {
        label: note.title,
        id: -itemIDBig, // Use negative bigint to distinguish notes and reminders from folders
      };
    });

    // Find reminders saved in the current folder
    const remindersInCurrFolder = reminders.filter(reminder => reminder.folderID === folder.folderID && reminder.isSaved);

    // For each reminder, create a QTree node with label and id properties and return it
    const reminderTreeNodes = remindersInCurrFolder.map((reminder) => {
      const itemIDBig = reminder.itemID;
      return {
        label: reminder.title,
        id: -itemIDBig,
      };
    });

    // For each folder, create a QTree node with label, id, and children properties and return it
    return {
      label: folder.folderName,
      id: folder.folderID,
      icon: 'folder',
      iconColor: 'blue',
      children: [
        ...noteTreeNodes,
        ...reminderTreeNodes,
        ...convertFolderTreetoQTree(folder.children ?? [], notes, reminders)
      ]
    };
  });
}

// Builds root note/reminder nodes (since root folder isnt visually represented in the tree)
export function buildRootNodes(folders: UIFolder[],notes: UINote[], reminders: UIReminder[]): QTreeFolder[] {
  // Build nested folder tree
  const nestedTree = nest(folders, 0n);

  // Convert nested folders to qtree nodes
  const folderNodes = convertFolderTreetoQTree(nestedTree, notes, reminders);

  // Find reminder and note root nodes (parent folder ID = 0) and map to QTree format
  const rootNoteNodes = notes.filter(note => note.isSaved && note.folderID === 0n).
  map(note => ({
    label: note.title,
    id: -note.itemID,
  }));

  const reminderRootNodes = reminders.filter(reminder => reminder.isSaved && reminder.folderID === 0n).
  map(reminder => ({
    label: reminder.title,
    id: -reminder.itemID,
  }));

  // Render root items first then folders
  return [...rootNoteNodes, ...reminderRootNodes, ...folderNodes];
}

// Function to normalize selected node to be folderID for breadcrumb trail navigation 
// Needed to distinguish because notes/reminders are selectable children with negative IDs in the tree
export function normalizeFolderID(selectedNode: bigint | null, notes: UINote[], reminders: UIReminder[], folders: UIFolder[]): bigint | null {
  // Selected tree node is null, return null
  if (selectedNode === null) {
    return null;
  }

  // Try to find folder in folders array that matches the selected node ID
  // May contain draft folders (negative IDs) that arent in the DB yet
  if (folders) {
    const folder = folders.find(folder => folder.folderID === selectedNode);
    if (folder) {
      return folder.folderID;
    }
  }
  
  // Selected tree node is positive ID, must be a folder, just return the folder
  if (selectedNode > 0n) {
    return selectedNode;
  }

  // Selected tree node is a reminder/note (negative of itemID), find its folder ID
  else {
    const itemID = selectedNode < 0n ? -selectedNode : selectedNode;
    // Try to find note thats itemID matches the selected node item ID 
    const note = notes.find(note => note.itemID === itemID);
    // If note is found, return its folderID
    if (note) {
      return note.folderID ?? null;
    }
    // Try to find reminder thats itemID matches the selected node item ID
    const reminder = reminders.find(reminder => reminder.itemID === itemID);
    // If reminder is found, return its folderID
    if (reminder) {
      return reminder.folderID ?? null;
    } 
}
return null;
}

// Function to build breadcrumbs array that walks from the selected folder up to the root to build the path
export function buildBreadcrumbs(selectedNode: bigint | null, folders: UIFolder[], notes: UINote[], reminders: UIReminder[]): { label: string; id: bigint }[] {
  // Normalize currently selected folder ID on QTree
  const currentFolderID = normalizeFolderID(selectedNode, notes, reminders, folders);
  // If no folder is currently selected, or the selected folder is DB root itself, show root label breadcrumb
  if (currentFolderID == null || currentFolderID === 0n) {
    return [{label: 'root', id: 0n}];
  }

  // Initialize empty path array
  const path: { label: string; id: bigint }[] = [];
  let currentID: bigint | null = currentFolderID;

  // While a folder is selected and not root, walk up the tree to build the path
  while (currentID != null && currentID != 0n) {
    // Find folder in folders array that matches the current folder ID
    const current = folders.find(folder => folder.folderID === currentID);
    // No current folder found, stop walking
    if (!current) break;
    // If current folder is valid, add it to the path
    path.push({ label: current.folderName, id: current.folderID });
    // Update currentID to be the parent folder ID for the next iteration
    currentID = current.parentFolderID;

    // If we reach the root folder, manually add the root folder to the path and stop walking
    // This is because it is not visually represented in the tree, just in the DB
    if (current.parentFolderID === 0n) {
       const root = folders.find(folder => folder.folderID === 0n);
       if (root) {
         path.push({ label: root.folderName, id: root.folderID });
         break;
       }
    }

  }
  // Reverse the path so visually it goes from root to selected folder
  return path.reverse();
}