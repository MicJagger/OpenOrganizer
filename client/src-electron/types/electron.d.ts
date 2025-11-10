/*
 * Authors: Kevin Sirantoine, Rachel Patella, Maria Pasaylo
 * Created: 2025-09-10
 * Updated: 2025-11-09
 *
 * This file declares sqliteAPI and electronStoreAPI for the renderer.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import type {
  Note,
  Extension,
  Folder,
  Reminder,
  DailyReminder,
  WeeklyReminder,
  MonthlyReminder,
  YearlyReminder,
  Deleted,
  RangeWindow
} from "app/src-electron/types/shared-types";

export {};

declare global {
  interface Window {
    sqliteAPI: {
      // create
      createNote: (newNote: Note) => Promise<void>;
      createReminder: (newRem: Reminder) => Promise<void>;
      createDailyReminder: (newDailyRem: DailyReminder) => Promise<void>;
      createWeeklyReminder: (newWeeklyRem: WeeklyReminder) => Promise<void>;
      createMonthlyReminder: (newMonthlyRem: MonthlyReminder) => Promise<void>;
      createYearlyReminder: (newYearlyRem: YearlyReminder) => Promise<void>;
      createFolder: (newFolder: Folder) => Promise<void>;
      createDeleted: (newDeleted: Deleted) => Promise<void>;

      // read
      readNote: (itemID: bigint) => Promise<Note>;
      readReminder: (itemID: bigint) => Promise<Reminder>;
      readDailyReminder: (itemID: bigint) => Promise<DailyReminder>;
      readWeeklyReminder: (itemID: bigint) => Promise<WeeklyReminder>;
      readMonthlyReminder: (itemID: bigint) => Promise<MonthlyReminder>;
      readYearlyReminder: (itemID: bigint) => Promise<YearlyReminder>;
      readFolder: (folderID: bigint) => Promise<Folder>;

      readNotesInRange: (windowStartMs: bigint, windowEndMs: bigint) => Promise<Note[]>;
      readRemindersInRange: (rangeWindow: RangeWindow) => Promise<Reminder[]>;
      readDailyRemindersInRange: (rangeWindow: RangeWindow) => Promise<DailyReminder[]>;
      readWeeklyRemindersInRange: (rangeWindow: RangeWindow) => Promise<WeeklyReminder[]>;
      readMonthlyRemindersInRange: (rangeWindow: RangeWindow) => Promise<MonthlyReminder[]>;
      readYearlyRemindersInRange: (rangeWindow: RangeWindow) => Promise<YearlyReminder[]>;

      readAllFolders: () => Promise<Folder[]>;

      readNotesInFolder: (folderID: bigint) => Promise<bigint[]>
      readRemindersInFolder: (folderID: bigint) => Promise<bigint[]>
      readDailyRemindersInFolder: (folderID: bigint) => Promise<bigint[]>
      readWeeklyRemindersInFolder: (folderID: bigint) => Promise<bigint[]>
      readMonthlyRemindersInFolder: (folderID: bigint) => Promise<bigint[]>
      readYearlyRemindersInFolder: (folderID: bigint) => Promise<bigint[]>
      readFoldersInFolder: (parentFolderID: bigint) => Promise<bigint[]>

      // update
      updateNote: (modNote: Note) => Promise<void>;
      updateReminder: (modRem: Reminder) => Promise<void>;
      updateDailyReminder: (modDailyRem: DailyReminder) => Promise<void>;
      updateWeeklyReminder: (modWeeklyRem: WeeklyReminder) => Promise<void>;
      updateMonthlyReminder: (modMonthlyRem: MonthlyReminder) => Promise<void>;
      updateYearlyReminder: (modYearlyRem: YearlyReminder) => Promise<void>;
      updateFolder: (modFolder: Folder) => Promise<void>;

      // delete
      deleteNote: (itemID: bigint) => Promise<boolean>;
      deleteReminder: (itemID: bigint) => Promise<boolean>;
      deleteDailyReminder: (itemID: bigint) => Promise<boolean>;
      deleteWeeklyReminder: (itemID: bigint) => Promise<boolean>;
      deleteMonthlyReminder: (itemID: bigint) => Promise<boolean>;
      deleteYearlyReminder: (itemID: bigint) => Promise<boolean>;
      deleteExtension: (itemID: bigint, sequenceNum: number) => Promise<void>;
      deleteAllExtensions: (itemID: bigint) => Promise<void>;
      deleteFolder: (folderID: bigint) => Promise<boolean>;
      clearAllTables: () => Promise<void>;

      // Example functions
      sqliteRead: (key: string) => Promise<string>;
      sqliteCreate: (key: string, value: string) => Promise<boolean>;
      sqliteUpdate: (key: string, value: string) => Promise<boolean>;
      sqliteDelete: (key: string) => Promise<boolean>;
    };

    syncAPI: {
      sync: () => Promise<void>;
    };

    electronStoreAPI: {
      getStoreName: () => Promise<string>;
      setStoreName: (name: string) => Promise<boolean>;
    };

    electronAuthAPI: {
      createAccount: (username: string, password: string) => Promise<{ success: boolean}>;
      loginAccount: (username: string, password: string) => Promise<{ success: boolean}>;
      clearLocalData: () => Promise<void>;
    }
  }
}
