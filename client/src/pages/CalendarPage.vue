<!--
 * Authors: Rachel Patella, Maria Pasaylo, Michael Jagiello
 * Created: 2025-09-22
 * Updated: 2025-11-08
 *
 * This file is the main home page that includes the calendar view, notes/reminders list, 
 * and a file explorer as a 3 column grid layout.
 *
 * References:
 * https://quasar.dev/vue-components/card/
 * https://quasar.dev/vue-components/tabs/
 * https://vuejs.org/guide/essentials/list to render reminder cards in a list
 * https://qcalendar.netlify.app/developing/qcalendar-month-mini-mode#mini-mode-theme for qcalendar code
 * https://vuejs.org/guide/essentials/watchers and https://codepen.io/mamyraoby/pen/zYaKwzZ for how to implement select all with checkboxes
 * https://stackoverflow.com/questions/18017869/build-tree-array-from-flat-array-in-javascript for building a nested folder data structure
 * https://qcalendar.netlify.app/developing/qcalendar-month for qcalendar month components and rendering slots of reminders
 * https://github.com/quasarframework/quasar/discussions/11048 for custom q-tree node headers
 * https://stackoverflow.com/questions/48351987/create-javascript-date-object-from-string-yyyy-mm-dd-in-local-timezone for constructing local date objects
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and 
 * license terms outlined in the LICENSE file located in the top-level directory of 
 * this distribution. No part of OpenOrganizer, including this file, may be reproduced, 
 * modified, distributed, or otherwise used except in accordance with the terms 
 * specified in the LICENSE file.
-->

<template>
  <div class="calendar-container">
    <q-dialog v-model="showSettings">
      <q-card style="width: 500px" class="q-px-sm q-pb-md">
        <q-card-section>
          <div class="text-h6">Settings</div>
          <div class="settings-container">
            <div class="settings-sidebar">
              <q-tabs v-model="settingsTab" vertical>
                <q-tab style="color: #474747" name="cloud" label="Cloud" icon="cloud" />
                <q-tab style="color: #474747" name="local" label="Local" icon="storage" />
              </q-tabs>
            </div>
            <div v-if="settingsTab === 'cloud'">
              <q-toggle style="size:2px; font-size:18px" v-model="isCloudOn" label="Cloud Sync" @update:model-value="onToggleCloudSync" :disable="isSyncing"/>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Left column - File Explorer top row-->
    <div style="grid-area: file-explorer-search; padding: 20px" data-area="file-explorer-search">
      <q-input
        v-model="searchQuery"
        dense
        outlined
        placeholder="Search notes and reminders by title here..."
        class="search-input"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
     <!-- Left column - File Explorer middle row-->
      <div style="grid-area: file-explorer-folders; padding: 0px 10px; display: flex; flex-direction: column; height: 100%" data-area="file-explorer-folders">
        <!-- Breadcrumb path component itself -->
        <q-breadcrumbs>
          <q-breadcrumbs-el label="" />
        </q-breadcrumbs>
        <q-breadcrumbs>
          <!-- Each selectable item in breadcrumb path -->
            <q-breadcrumbs-el
            v-for="crumb in breadcrumbs"
            :key="String(crumb.id)"
            :label="crumb.label"
            @click="selectBreadcrumbItem(crumb.id)"
          /> 
        </q-breadcrumbs>
        <q-tree 
          :nodes="qNestedTree"
          node-key="id"
          no-connectors
          default-expand-all
          :selected="selectedFolderID"
          @update:selected="handleTreeSelection"
        >
          <!-- Render q-input box where node label (name) would be with custom slot -->
          <!-- How to add custom node header: https://github.com/quasarframework/quasar/discussions/11048 -->
          <template v-slot:default-header ="{ node }">
            <div style="display: flex; align-items: center" @click.stop @keypress.stop>
              <!-- find the UIFolder for this node and if that folder is editing, show it inline -->
              <template v-if="getFolder(node.id) && getFolder(node.id)!.isEditing">
                <q-input dense
                  :key="String(node.id)"
                  v-model="getFolder(node.id)!.temporaryFolderName"
                  :error="(getFolder(node.id)!.folderNameError) != ''"
                  :error-message="getFolder(node.id)!.folderNameError"
                  @keyup.enter.prevent="saveFolder(getFolder(node.id)!)"
                  @keyup.esc.prevent="cancelRename(getFolder(node.id)!)"
                  placeholder="Folder name"
                  style="min-width: 160px;"
                />
              </template>
              <template v-else-if="getReminder(node.id) && getReminder(node.id)!.isEditing">
                <q-input dense
                  :key="String(node.id)"
                  v-model="getReminder(node.id)!.temporaryTitle"
                  :error="(getReminder(node.id)!.titleMessageError) != ''"
                  :error-message="getReminder(node.id)!.titleMessageError"
                  @keyup.enter.prevent="saveReminder(getReminder(node.id)!)"
                  @keyup.esc.prevent="cancelRename(getReminder(node.id)!)"
                  placeholder="Reminder name"
                  style="min-width: 160px;"
                />
              </template>
              <template v-else-if="getNote(node.id) && getNote(node.id)!.isEditing">
                <q-input dense
                  :key="String(node.id)"
                  v-model="getNote(node.id)!.temporaryTitle"
                  :error="(getNote(node.id)!.titleMessageError) != ''"
                  :error-message="getNote(node.id)!.titleMessageError"
                  @keyup.enter.prevent="saveNote(getNote(node.id)!)"
                  @keyup.esc.prevent="cancelRename(getNote(node.id)!)"
                  placeholder="Note name"
                  style="min-width: 160px;"
                />
              </template>
              <!-- If not editing, simply show the folder name. If it has an icon (folder), show it -->
              <template v-else>
                <div class="row items-center">
                  <q-icon v-if="node.icon" :name="node.icon" :color="node.iconColor" class="q-mr-sm" />
                  <span>{{ node.label }}</span>
                </div>
              </template>
            </div>
          </template>
        </q-tree>
        <div style="display: flex; flex-wrap: wrap; align-items: center; margin-top: auto; gap: 4px;">
          <q-btn style="font-size: 0.9rem; color: #474747;" flat  icon="add"  label="Add" @click="addFolder()" />
          <q-btn style="font-size: 0.9rem; color: #474747;" flat  icon="delete"  label="Delete" @click="deleteTreeNode()" />
          <q-btn style="font-size: 0.9rem; color: #474747;" flat  icon="edit"  label="Rename" @click="renameTreeNode()" />
        </div>
      </div>
     
      <!-- Left column - File Explorer bottom row-->
      <div style="grid-area: file-explorer-cloud; padding: 20px 30px; display: flex; border-top: 1px solid #adadadcc; align-items: center; gap: 8px;" data-area="file-explorer-cloud">
        <div style="color: #474747; font-size: 1.15rem;">{{  syncStatusMessage }} </div>
        <q-icon :name="cloudIcon" size="20px" style="color: #474747" />
      </div>
      
    <!-- Middle column - List View of Notes/Reminders -->
    <div class="grid-seperator" style="background-color: #efefef; grid-area: reminder-notes;">
      <q-tabs v-model="tab" class="calendar-tabs dense">
        <q-tab name="reminders" icon="alarm" label="Reminders" />
        <q-tab name="notes" icon="note" label="Notes" />
      </q-tabs>
      <div class="row justify-between items-center">
        <div class="row items-center">
          <q-btn style="font-size: 15px" flat icon="add" @click="addArrayItem" class="q-mr-sm" />
          <q-checkbox v-model="selectAll" color="primary" label="Select All" />
        </div>
        <q-btn style="font-size: 15px" flat icon="delete" @click="deleteArrayItem"></q-btn>
      </div>
      <div class="reminder-note-card-container">
        <div v-if="tab === 'reminders'">
          <!-- Reminder Cards -->
          <q-card class="reminder-note-cards" v-for="item in filteredReminders" :key="String(item.itemID)">
            <q-expansion-item v-model="item.expanded" expand-icon="keyboard_arrow_down">
              <template v-slot:header>
                  <div class="reminder-header-container">
                    <q-checkbox :color="getEventTypeColor(eventTypes, item.eventType)" v-model="item.isSelected" class="q-mr-sm" />
                    <q-input
                      v-model="item.temporaryTitle"
                      :error="item.titleMessageError != ''"
                      :error-message="item.titleMessageError"
                      placeholder="Enter reminder title..."
                      borderless
                      dense
                      style="max-width: 450px; padding-top: 20px"
                      @click.stop
                      @focus.stop
                      />
                    </div>
              </template>
              <q-card-section>
                    <div style="padding-bottom:10px">
                      Event date: {{ item.date }}<br>
                      Last modified: {{(item.temporaryLastModified) }}
                    </div>
                <q-select
                v-model="item.eventType"
                :options="eventTypeOptions"
                label="Event Type"
                emit-value
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
                <q-select
                v-model="item.temporaryFolderID"
                :options="folderDropdownOptions"
                label="Save in folder"
                emit-value 
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
              <q-select
                v-model="item.temporaryNotificationTime"
                :options="notificationOptions"
                label="Remind me:"
                emit-value 
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
              <q-input
                  v-model="item.temporaryEventStartTime"
                  :label="getEventStartLabel(item.eventType)"
                  type="time"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-input
                  v-model="item.temporaryEventEndTime"
                  :label="getEventEndLabel(item.eventType)"
                  type="time"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
              <!-- Render fields for selected event type - each input corresponds to its type -->
              <div v-for="field in getEventTypeFields(eventTypes, item.eventType)" :key="field.id" style="margin-bottom: 10px">
                <q-input
                 v-if="field.type === 'text'"
                  v-model="item.extension[field.id]"
                  :type="field.type"
                  :label="field.name"
                  outlined
                  dense
                  style="background-color: #f2f2f2"
                />
                <q-input
                v-else-if="field.type === 'number'"
                v-model.number="item.extension[field.id]"
                :label="field.name"
                type="number"
                dense
                outlined
                style="background-color: #f2f2f2"
              />
              <q-input
                v-else-if="field.type === 'time'"
                v-model="item.extension[field.id]"
                :label="field.name"
                type="time"
                dense
                outlined
                style="background-color: #f2f2f2"
              />
              </div>
              <!-- Use seperate v-if for error instead of :error prop because it's validating two inputs (arrival & departure) instead of 1 -->
              <div v-if="item.timeMessageError" style="color: #f44336; font-size: 13px; margin-bottom: 8px;">
                {{ item.timeMessageError }}
              </div>
                <div class="row">
                  <q-btn class="login-register-button" style="font-size: 15px; margin-right: 10px" flat label="Save" @click="saveReminder(item)"></q-btn>
                  <q-btn class="login-register-button" style="background-color: grey; font-size: 15px" flat label="Cancel" @click="cancelReminder(item)"></q-btn>
                </div>
              </q-card-section>
            </q-expansion-item>
          </q-card>
        </div>
        <div v-if="tab === 'notes'">
          <!-- Note Cards -->
          <q-card class="reminder-note-cards" v-for="(item, index) in filteredNotes" :key="index">
            <q-expansion-item v-model="item.expanded" expand-icon="keyboard_arrow_down">
              <template v-slot:header>
                <div class="reminder-header-container">
                  <q-checkbox v-model="item.isSelected" class="q-mr-sm" />
                  <q-input
                      v-model="item.temporaryTitle"
                      :error="item.titleMessageError != ''"
                      :error-message="item.titleMessageError"
                      placeholder="Enter note title..."
                      borderless
                      dense
                      style="max-width: 300px; padding-top: 20px"
                      @click.stop
                      @focus.stop
                    />
                </div>
              </template>
              <!-- Emit-value makes it so the dropdown option only saves the value (ex. folder id = 1 rather than the whole object {folder: name, id, etc.}) -->
              <q-card-section>
                      <div style="padding-bottom:10px">
                      Last modified: {{ item.temporaryLastModified }}
                    </div>
                <q-select
                v-model="item.temporaryFolderID"
                :options="folderDropdownOptions"
                label="Save in folder"
                emit-value 
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
                <q-input class="note-box" outlined v-model="item.temporaryText" type="textarea"
                  placeholder="Write your note here..." />
                <div class="row">
                  <!-- Pass in current note item from v-for to save that specific note -->
                  <q-btn class="login-register-button" style="font-size: 15px; margin-right: 10px" flat label="Save" @click="saveNote(item)"></q-btn>
                  <q-btn class="login-register-button" style="background-color: grey; font-size: 15px" flat label="Cancel" @click="cancelNote(item)"></q-btn>
                </div>
              </q-card-section>
            </q-expansion-item>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Right column - Calendar (top row) -->
    <div style="grid-area: calendar; padding: 20px" data-area="calendar">
      <div style="display: flex; justify-content: center">
        <div style="
            max-width: 400px;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 10px;
          ">
          <div style="width: 100%; display: flex; justify-content: space-evenly">
            <div style="width: 50%; display: flex; justify-content: space-between">
              <span class="q-button" style="cursor: pointer; user-select: none;" @click="onToday">Today</span>
              <span class="q-button" style="cursor: pointer; user-select: none" @click="onPrev">&lt;</span>
              {{ formattedMonth }}
              <span class="q-button" style="cursor: pointer; user-select: none" @click="onNext">&gt;</span>
            </div>
            <div style="width: 30%; display: flex; justify-content: space-between">
              <span class="q-button" style="cursor: pointer; user-select: none" @click="addToYear(-1)">&lt;</span>
              {{ selectedYear }}
              <span class="q-button" style="cursor: pointer; user-select: none" @click="addToYear(1)">&gt;</span>
            </div>
          </div>
          <div style="display: flex; justify-content: center; align-items: center;">
            <div style="display: flex; max-width: 500px; width: 100%; flex-direction: column;"> 
              <q-calendar-month ref="calendar" v-model="selectedDate" mini-mode hoverable focusable
                :focus-type="['date', 'weekday']" :min-weeks="6" animated @change="onChange" @moved="onMoved"
                @click-date="onClickDate" @click-day="onClickDay" @click-workweek="onClickWorkweek"
                @click-head-workweek="onClickHeadWorkweek" @click-head-day="onClickHeadDay" style="height: 400px;" >
                <template #day="{ scope: { timestamp } }">
              <template v-for="event in eventsMap[timestamp.date]" :key="String(event.id)">
                <div
                  :class="['text-white', `bg-${event.color}`, 'row', 'justify-start', 'items-center', 'no-wrap', 'event-card']"
                  style="width: 100%; margin: 1px 0 0 0; padding: 0 2px; font-size: 12px; cursor: pointer;"
                  @click="onClickCalendarEvent(event)"
                >
                  <div class="event-title" style="width: 100%; max-width: 100%;">
                  {{ event.title }}
                  </div>
                </div>
              </template>
            </template>
              </q-calendar-month>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right column - Spacer (middle row, can be empty) -->
    <div style="grid-area: calendar-spacer;" data-area="calendar-spacer"></div>

    <!-- Right column - Settings/Account Buttons (bottom row) -->
    <div style="grid-area: account-settings; padding: 20px 30px; border-top: 1px solid #adadadcc; align-items: center; gap: 8px;"  data-area="account-settings">
      <div class="row justify-between items-center">
        <q-btn class="account-and-settings-button" flat icon="account_circle" @click="$router.push('/register')" />
        <q-btn class="account-and-settings-button" flat icon="settings" @click="showSettings = true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {QCalendarMonth, addToDate, parseTimestamp, today, type Timestamp} from '@quasar/quasar-ui-qcalendar';
import '@quasar/quasar-ui-qcalendar/index.css';
import {buildCalendarEvents, groupEventsByDate, getEventTypeColor, getEventTypeFields, getEventStartLabel, getEventEndLabel, type EventType, type CalendarEvent} from '../frontend-utils/events';
import { buildBreadcrumbs, normalizeFolderID, buildRootNodes} from '../frontend-utils/tree';
import { convertTimeAndDateToTimestamp, convertNotificationTimestamp, timeStamptoEpoch, timestampToTimeString, minutesToHHMM } from '../frontend-utils/time';
import { ref, computed, watch, onMounted } from 'vue';
import type { UINote, UIReminder, UIFolder } from '../types/ui-types';
import type { Reminder, Note, Folder } from '../../src-electron/types/shared-types';
import {createNote, createReminder, createFolder, createRootFolder, readNote, readReminder, readAllFolders, updateNote, updateReminder, updateFolder, deleteItem, deleteFolder, readRemindersInRange, readNotesInRange} from '../utils/local-db';
// Initialize active tab to reminder by default
const tab = ref('reminders');
const settingsTab = ref('cloud');
// Array of reminders 
const reminders = ref<UIReminder[]>([])
// Array of reminders by month for calendar
const monthReminders = ref<UIReminder[]>([])

// List of notification options for when to be notified for reminder
// Value is minutes before the event start time
const notificationOptions = [
  { label: 'Never', value: null },
  { label: 'At time of event', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 }
  ];
// Array of notes
const notes = ref<UINote[]>([])

// Object of event types
// Every reminder has event start time, event end time fields so these are not extensions
// These are just named differently depending on event type (ex. flight has arrival - start and departure - end times. 
// Hotel has check-in - start and check out - end times)
const eventTypes: EventType[] = [
   {
       // Generic event type (no extra type fields)
        id: 0,
        name: 'General',
        color: 'blue',
        fields: []
    },
    {
       // In backend each event type is assigned an integer - ex. flight - 1, hotel = 2, etc.
        id: 1,
        // Event type name 
        name: 'Flight',
        // Color-coded for display in reminder list
        color: 'red',
        // Fields for each event type
        fields: [
            {
               // Essentially the unique ID/key of the field
                id: 'flightNumber',
               // Name of the field displayed to the user
                name: "Flight Number",
                // Type is helpful for rendering the frontend field inputs to match and input validation. 
                type: 'number'
            },
            {
                id: 'airportLocation',
                name: "Airport Location",
                type: 'text'
            },
        ]
    },
    {
        id: 2,
        name: 'Hotel',
        color: 'green',
        fields: [
            {
                id: 'roomNumber',
                name: "Room Number",
                type: 'number'
            },
            {
                id: 'hotelLocation',
                name: "Hotel Location",
                type: 'text'
            },
        ]
    }
    // can add any more event types here
  ];


// Map event types to format for q-select dropdown menu
const eventTypeOptions = computed(() => {
  return eventTypes.map(eventType => ({
    label: eventType.name,
    value: eventType.id
  }));
});

const showSettings = ref(false);
const isCloudOn = ref(false);
const isSyncing = ref(false);
const syncStatusMessage = ref('Cloud Not Synced')

// Function to handle toggling cloud sync on/off
async function onToggleCloudSync() {
  if (!isCloudOn.value) {
    return;
  }

  // If already syncing, dont start another sync
  if (isSyncing.value) {
    return;
  }

  // Was not syncing, start sync
  isSyncing.value = true;
  syncStatusMessage.value = 'Syncing...';

  try {
    await window.syncAPI.sync();
    syncStatusMessage.value = 'Cloud Synced Successfully';
    console.log('Cloud sync completed successfully');
  } catch (error) {
    syncStatusMessage.value = 'Cloud Sync Failed';
    console.error('Error during cloud sync:', error);
   // Incase of error, reset sync status
  } finally {
    isSyncing.value = false;
  }
}

// Change icon depending on cloud sync status
const cloudIcon = computed(() => {
  // Cloud toggle is off
  if (!isCloudOn.value) {
    return 'cloud_off'
  }
  // Currently syncing
  if (isSyncing.value) {
    return 'cloud_sync'
  }
  // Sync successful
  if (syncStatusMessage.value === 'Cloud Synced Successfully') {
    return 'cloud_done'
  }
  // Sync failed
  if (syncStatusMessage.value === 'Cloud Sync Failed') {
    return 'cloud_off'
  }
  // Default
  return 'cloud'
})

const selectAll = ref(false)
const searchQuery = ref('');
// Specific folder ID currently selected in the file explorer tree, tracked for adding folder in that specific spot
// null is if there is no folder selected on the tree, this by default
const selectedFolderID = ref<bigint | null>(null);
const folders = ref<UIFolder[]>([]);

// Map folders to format for q-select dropdown menu
// Each option has a label (name of the option/folder in the dropdown) and a value (actual folder to save note into)
// Computed so it automatically updates whenever folders array updates (if new folder is added it shows up in the options)
const folderDropdownOptions = computed(() => {
  return folders.value.map(folder => ({
    label: folder.folderName,
    value: folder.folderID
  }));
});


// Function to get reminder by its ID
function getReminder(id?: bigint | null): UIReminder | null {
  const reminderID = id ?? selectedFolderID.value;
  // No tree node selected
  if (reminderID === null) {
    return null;
  }
  const treeReminderID = -reminderID;
  return reminders.value.find(reminder => String(reminder.itemID) === String(treeReminderID)) ?? null;
}

// Function to get note by its ID
function getNote(id?: bigint | null): UINote | null {
  const noteID = id ?? selectedFolderID.value;
  if (noteID === null) {
    return null;
  }
  const treeNoteID = -noteID;
  return notes.value.find(note => String(note.itemID) === String(treeNoteID)) ?? null;
}

// Function to get folder by its ID
// getFolder() returns UI folder object for currently selected folder in tree
// getFolder(ID) returns UI folder for a specific node ID
// When rendering tree nodes, check isEditing property of the UIFolder to see if it should show q-input
function getFolder(id?: bigint | null): UIFolder | null {
  const folderID = id ?? selectedFolderID.value;
  if (folderID === null) {
    return null;
  }
  return folders.value.find(folder => String(folder.folderID) === String(folderID)) ?? null;
}

// Function to handle selection changes in file explorer tree
// Prevents changing selected node while editing so input box stays focused
function handleTreeSelection(newlySelectedNode: bigint | null) {
  // If any node is being edited, do not change selected node until editing is done
  const nodeBeingEdited = folders.value.some(folder => folder.isEditing) ||
                        reminders.value.some(reminder => reminder.isEditing) ||
                        notes.value.some(note => note.isEditing);
  if (nodeBeingEdited) {
    return;
  }
  // Otherwise, allow selection to other nodes like normal
  else {
    selectedFolderID.value = newlySelectedNode;

    // If individual reminder or note (negative ID) is selected, navigate to its expanded view in list
    if (newlySelectedNode !== null && newlySelectedNode < 0n) {
      const itemID = -newlySelectedNode;

      const reminder = reminders.value.find(reminder => String(reminder.itemID) === String(itemID));
      // Node is a reminder
      if (reminder) {
        // Switch to reminder tab
        tab.value='reminders';
        // Set date to reminder date on calendar
        selectedDate.value = reminder.date;
        // Collapse all other reminders except the selected entry
        reminders.value.forEach(reminder =>  {reminder.expanded = false; })
        // Expand the selected reminder card 
        reminder.expanded = true;
        return;
      }
      // Node is a note
      const note = notes.value.find(note => String(note.itemID) === String(itemID));
      if (note) {
        tab.value='notes';
        // Collapse all other notes except the selected entry
        notes.value.forEach(note =>  {note.expanded = false; })
        // Expand the selected note card
        note.expanded = true;
        return;
      }
    }
  }
}

// When rename button is clicked, set isEditing (q-input field) to appear for tree node
// On enter when editing, folder is renamed
function renameTreeNode() {
  const selectedTreeNode  = selectedFolderID.value
  if (selectedTreeNode === null) {
    return;
  }
  // Positive ID, rename a folder
  if (selectedTreeNode >= 0n) {
    const folder = getFolder(selectedTreeNode);
    if (folder) {
        // Show input box
        folder.isEditing = true;
        // Set temporary name displayed in tree to written name
        folder.temporaryFolderName = folder.folderName;
        selectedFolderID.value = folder.folderID;
    }
  }
  // Negative ID, rename a reminder or note
  else {
    const reminder = getReminder(selectedTreeNode);
    if (reminder) {
        reminder.isEditing = true;
        reminder.temporaryTitle = reminder.title;
        selectedFolderID.value = -reminder.itemID;
    }
    const note = getNote(selectedTreeNode);
    if (note) {
        note.isEditing = true;
        note.temporaryTitle = note.title;
        selectedFolderID.value = -note.itemID;
    }
  }
}

// On escape when editing, cancel rename and revert back to original name
function cancelRename(item: UIReminder | UINote | UIFolder) {
  if (!item) return;

  // Distinguish between folder and reminder/note by checking for unique property
  // Rename a folder
  if ('temporaryFolderName' in item) {
    item.isEditing = false;
    item.temporaryFolderName = item.folderName;
    item.folderNameError = '';
    return;
  } 
  // Rename a reminder
  else if ('temporaryEventStartTime' in item) {
    item.isEditing = false;
    item.temporaryTitle = item.title ?? '';
    item.titleMessageError = '';
    return;
  }
  // Rename a note
  else if ('temporaryText' in item) {
    item.isEditing = false;
    item.temporaryTitle = item.title ?? '';
    item.titleMessageError = '';
    return;
  }
}

// Convert nested folder tree to Q-Tree format
// Computed since it relies on nestedFolderTree, so it automatically updates whenever the nested folder tree updates
const qNestedTree = computed(() => buildRootNodes(folders.value, notes.value, reminders.value));

// Computed breadcrumbs array that walks from the selected folder up to the root to build the path
const breadcrumbs = computed(() => buildBreadcrumbs(selectedFolderID.value, folders.value, notes.value, reminders.value))

// Click a breadcrumb name to select that folder in the tree
// Reactive so whenever selected folder ID changes, breadcrumb path will be ran and recomputed automatically
function selectBreadcrumbItem(folderID : bigint) {
  selectedFolderID.value = folderID;
}

// temp id generator for UI-only drafts (negative IDs)
let tempIDCounter = -2n;
// Function to add a reminder to the list on the specified calendar date
function addReminder() {
  // create a UI-only draft reminder with a temporary negative bigint ID
  const tempID = tempIDCounter--;
  // Folder to save reminder in is either root by default if nothing is selected, otherwise selected folder in tree
  const folderID = selectedFolderID.value ?? 0n;

  const draft: UIReminder = {
    itemID: tempID,
    folderID: folderID,
    eventType: 0,
    extension: {},
    title: '',
    // Draft has no notification
    temporaryNotificationTime: null,
    temporaryEventStartTime: '',
    temporaryEventEndTime: '',
    temporaryLastModified: new Date().toLocaleString(),
    temporaryTitle: '',
    temporaryFolderID: folderID,
    date: selectedDate.value,
    titleMessageError: '',
    folderMessageError: '',
    timeMessageError: '',
    isSaved: false, // Draft - first time hitting add creates a draft reminder not yet saved
    isEditing: false,
    isSelected: false,
    expanded: true,
  } as UIReminder;

  // Add draft reminder to reminders array for UI rendering
  reminders.value.push(draft);
  // Close other reminders when a new one is added
  reminders.value.forEach((reminder, index) => {
    if (index < reminders.value.length - 1) {
      reminder.expanded = false
    }
  })
}

// Function to display reminders for selected calendar date
async function loadRemindersForCalendarDate(dateString: string) {
  // Compute timestamp for start and end of selected date/day, '' is treated as 00:00 in helper
  const startOfDay = convertTimeAndDateToTimestamp(dateString, '');
  const endOfDay = convertTimeAndDateToTimestamp(dateString, '23:59');

  try {
    // Filter out any reminders already in list for that date to avoid duplicates
    reminders.value = reminders.value.filter(reminder => reminder.date !== dateString);
    // Read reminders for currently selected date from local DB
    const rows = await readRemindersInRange(startOfDay, endOfDay);
    // Convert each reminder in range from response to UI reminder format 
    for (const reminder of rows) {
      mapDBToUIReminder(reminder, true);
    }
    // console.log('Reminders for date loaded successfully:');
  } catch (error) {
    console.error('Error loading reminders for date:', error);
  }
}

// Function to display reminders for selected month on calendar
// Pass in calendar string YYYY-MM-DD
async function loadRemindersForMonth(dateString: string) {
  // Split date string by delimiter '-' to get each part (year, month, day)
  const [yearString, monthString, dayString] = dateString.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  // Check for invalid month
  if (month < 1 || month > 12) {
    console.error('Invalid month value:', month);
    return;
  }

  // Check for invalid day
  if (day < 1 || day > 31) {
    console.error('Invalid day value:', day);
    return;
  }

  // Check for invalid year
  if (year < 1) {
    console.error('Invalid year value:', year);
    return;
  }

  // Build start and end timestamps to load in range (from first day to last day of month)
  // First day of the month - ex. 2025-11-01
  const startDayOfMonth= `${year}-${String(month).padStart(2, '0')}-01`;
  // Last day of the month - ex. 2025-11-30
  // Date returns the day before the first day of the next month (always the last day - ex. 30 for Nov, 31 for Dec, 28 for Feb)
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const lastDayString = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

  // Convert to qcalendar timestamps
  const startRange = convertTimeAndDateToTimestamp(startDayOfMonth, '');
  const endRange = convertTimeAndDateToTimestamp(lastDayString, '23:59');

  try {
    // Reload monthReminders for calendar 
    monthReminders.value = [];
    const rows = await readRemindersInRange(startRange, endRange);
    const requestedYM = `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}`;
    // Convert each reminder in range from response to UI reminder format 
    for (const reminder of rows) {
      // Update reminders list
      const result = mapDBToUIReminder(reminder, false);
      // Extra check to only include items whos month match the calendar month
        if (result.date && result.date.startsWith(requestedYM)) {
          // push into monthReminders so the calendar uses these events
          monthReminders.value.push(result);
        }
        // console.log('Reminders for month successfully loaded:');
      }
    } catch (error) {
    console.error('Error loading reminders for month:', error);
  } 
}

// grabs all reminders created from the provided year, the previous and the next year
// if no year is provided, uses the current year
async function loadReminders(year?: number) {
  if (year == undefined) year = new Date().getFullYear();
  const currentYear = year;
  const lastYear = (currentYear == 1) ? -1 : currentYear - 1;
  const nextYear = (currentYear == -1) ? 1 : currentYear + 1;
  const start = convertTimeAndDateToTimestamp(lastYear.toString() + '-01-01', '');
  const end = convertTimeAndDateToTimestamp(nextYear.toString() + '-12-31', '23:59');
  try {
    // clear list before reloading
    reminders.value = [];
    const rows = await readRemindersInRange(start, end);
    // convert each note in range from response to UI note format
    for (const reminder of rows) {
      await mapDBToUIReminder(reminder, true);
    }
    // sort reminders alphabetically by title for tree 
    reminders.value.sort((a, b) => {return String(a.temporaryTitle ?? a.title ?? '').toLowerCase().localeCompare(String(b.temporaryTitle ?? b.title ?? '').toLowerCase());});
    // console.log('All reminders loaded successfully:');
  } catch (error) {
    console.error('Error loading reminders:', error);
  }
}

// Function to add a note to the list
function addNote() {
  // create a UI-only draft note with a temporary negative bigint ID
  const tempID = tempIDCounter--;
   // Folder to save note in is either root by default if nothing is selected, otherwise selected folder in tree
  const folderID = selectedFolderID.value ?? 0n;

   const draft: UINote = {
    itemID: tempID,
    folderID: folderID,
    title: '',
    temporaryTitle: '',
    temporaryFolderID: folderID,
    temporaryLastModified: new Date().toLocaleString(),
    text: '',
    temporaryText: '',
    date: selectedDate.value,
    titleMessageError: '',
    folderMessageError: '',
    isSaved: false, 
    expanded: true,
    isSelected: false
  } as UINote;

  // Add draft note to notes array for UI rendering
  notes.value.push(draft);
  // Close other notes when a new one is added
  notes.value.forEach((note, index) => {
    if (index < notes.value.length - 1) {
      note.expanded = false
    }
  })
}

// Root folder should always exist
async function addRootFolder() {
  try {
    // Try to load existing folders from local db
    const folders = mapDBToUIFolder(await readAllFolders());
    // If no root folder exists (no folders with parentFolderID === -1), create one
    const hasRootFolder = folders.some(folder => folder.parentFolderID === -1n || folder.folderID === 0n);
    if (!hasRootFolder) {
      await createRootFolder(-1);
      console.log('Root folder created.', folders);
      // Refresh folder list after creating root folder
      await readAllFolders();
    }
    else {
      // Root folder already exists
      //console.log('Root folder already exists.');
    }
  }
  catch (error) {
    console.error('Error adding root folder:', error);
  }
}
  
// Map a DB reminder row into the UI reminder shape needed for card display
// Additional upsert parameter decides whether to add/update the global reminders array
function mapDBToUIReminder(row: Reminder, upsert: boolean): UIReminder {
  // Create a date in local timezone from DB row for UI so filtered reminder/note list only shows entries whose event date match the calendar date
  // Get minute of day, event day, and event year from DB row
  const minuteOfDay = Number(row.eventStartMin);
  const eventDay = Number(row.eventStartDay);
  const eventYear = Number(row.eventStartYear);
  // Start at january 1st of event year and add days to get the right month/day. 
  const date = new Date(eventYear, 0, 1);
  // Set date object to event day
  date.setDate(date.getDate() + (eventDay - 1));
  // Calculate hours: divide number of minutes by 60 to get hours
  // Floor to return actual integer hour, no decimals
  const eventHour = Math.floor(minuteOfDay / 60);
  // Calculate remaining minutes: take minutes and modulo 60 (remainder is number of minutes)
  const eventMinute = minuteOfDay % 60;
  // Set hours and minutes of date object
  date.setHours(eventHour, eventMinute, 0, 0);
  // Convert date to YYYY-MM-DD string format compatible with qcalendar/selectedDate
  // getMonth returns zero-based index add 1 to get actual month number
  // Pad month and day so its always two digits - ex. day 5 becomes 05
  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  // Get last modified and convert for display
  const lastModifiedEpoch = Number(row.lastModified);
  const reminderDate = new Date(lastModifiedEpoch);
  // YYYY-MM-DD string format compatible with qcalendar/selectedDate
  // getMonth returns zero-based index so add 1 to get actual month number
  const lastModifiedTimeAndDate = reminderDate.toLocaleString();

  // Add extension onto reminder row type at compile time
  const typedRow = row as Reminder & { extension?: Record<string, string | number | null> };

  // Build extension row time fields from database stored dayOfMin value (to properly format and display)
  const ext: Record<string, string | number | null> = { ...(typedRow.extension ?? {}) };

  // Derive HH:MM time strings for display from database stored minutes of day value
  // Convert event start and end min into HH:MM string
  const startStr = (typeof row.eventStartMin === 'number') ? minutesToHHMM(row.eventStartMin) : '';
  const endStr = (typeof row.eventEndMin === 'number') ? minutesToHHMM(row.eventEndMin) : '';

  const eventStartMin = typeof row.eventStartMin === 'number' ? row.eventStartMin : null;
  const notifMin = typeof row.notifMin === 'number' ? row.notifMin : null;
  // Compute dropdown remind me option (ex. 5 mins before event time)
  const minutesBeforeStartTime = (row.hasNotif === 1 && eventStartMin != null && notifMin != null) ? eventStartMin - notifMin : null;

 // Need to add fields to the DB reminder row specific to the UI card
 // Sets temporary fields to saved values from DB
  const UIReminder = {
    // Copy all fields from DB shared type 
    ...row,
    // normalize itemID and folder IDs to bigint so they match folder IDs used by the tree
    itemID: (typeof row.itemID === 'bigint') ? row.itemID : BigInt(row.itemID),
    folderID: (typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID ),
    temporaryFolderID: row.folderID == null ? null : ((typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID)),
    // Add on UI specific fields
    temporaryTitle: row.title ?? '',
    // Replace this with actual extension fields later when support is added 
    extension: ext,
    temporaryEventStartTime: startStr,
    temporaryEventEndTime: endStr,
    // If theres a notification, temporary notification time is reminder notification minute of day 
    temporaryNotificationTime: minutesBeforeStartTime,
    temporaryLastModified: lastModifiedTimeAndDate,
    date: dateString,
    titleMessageError: '',
    folderMessageError: '',
    timeMessageError: '',
    isSaved: true,
    isEditing: false,
    isSelected: false,
    expanded: true,
  } as UIReminder;

  // If true, update (if existing) or insert (if not) UI reminder into global reminders array
  if (upsert) {
    // Compute index for a reminder for card display, use itemID as unique index
    // Look for existing reminder in reminders array that matches the itemID of the converted reminder
    const index = reminders.value.findIndex(reminder => String(reminder.itemID) === String(UIReminder.itemID));
    if (index >= 0) {
    // If found, replace preexisting reminder in array with new UI object
    reminders.value[index] = UIReminder;
  } else {
    // If not found, add new UI object reminder to the array
    reminders.value.push(UIReminder);
  }
}
  return UIReminder;
}

// Map a DB folder row into the UI folder shape
function mapDBToUIFolder(rows: Folder[]): UIFolder[] {
 const row = (rows ?? []).map(row => ({
    // Copy all fields for a folder from DB row
    ...row,
    temporaryFolderName: row.folderName ?? '',
    folderNameError: '',
    // If folderID is already a bigint, return it. Otherwise, cast value to a bigint
    folderID: (typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID),
    parentFolderID: (typeof row.parentFolderID === 'bigint') ? row.parentFolderID : BigInt(row.parentFolderID),
    lastModified: (typeof row.lastModified === 'bigint') ? row.lastModified : BigInt(row.lastModified),
    isSaved: true,
    isEditing: false
  })) as UIFolder[];

  // How to sort alphabetically: https://stackoverflow.com/questions/6712034/sort-array-by-firstname-alphabetically-in-javascript
  // Sort folder names alphabetically in folder array
  // Normalize to lowercase so the sorting is case-insensitive
  row.sort((a, b) => String(a.folderName ?? '').toLowerCase().localeCompare(String(b.folderName ?? '').toLowerCase()));
  return row;
}

// Function to map a DB note row into the UI note shape needed for card display
function mapDBToUINote(row: Note, upsert: boolean): UINote {
  // Create a date from the lastModified timestamp for UI
  // cast to number for date operations
  const lastModifiedEpoch = Number(row.lastModified);
  const noteDate = new Date(lastModifiedEpoch);
  // YYYY-MM-DD string format compatible with qcalendar/selectedDate
  // getMonth returns zero-based index so add 1 to get actual month number
  const dateString = `${noteDate.getFullYear()}-${String(noteDate.getMonth() + 1).padStart(2, '0')}-${String(noteDate.getDate()).padStart(2, '0')}`;
  // For display
  const lastModifiedTimeAndDate = noteDate.toLocaleString();

  // Need to add fields to the DB note row specific to the UI card
  // Sets temporary fields to saved values from DB
  const UINote = {
    // Copy all fields from DB shared type 
    ...row,
    itemID: (typeof row.itemID === 'bigint') ? row.itemID : BigInt(row.itemID),
    folderID: (typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID),
    temporaryFolderID: row.folderID == null ? null : ((typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID)),
    temporaryTitle: row.title ?? '',
    temporaryText: row.text ?? '',
    date: dateString,
    temporaryLastModified: lastModifiedTimeAndDate,
    titleMessageError: '',
    folderMessageError: '',
    isSaved: true,
    isEditing: false,
    isSelected: false,
    expanded: true,
  } as UINote;

  if (upsert) {
    // Compute index for a note for card display, use itemID as unique index
    // Look for existing note in notes array that matches the itemID of the newly created note
    const index = notes.value.findIndex(note => String(note.itemID) === String(UINote.itemID));
  if (index >= 0) {
    // If found, replace preexisting note in array with new UI object
    notes.value[index] = UINote;
  } else {
    // If not found, add new UI object note to the array
    notes.value.push(UINote);
  }
}

  return UINote;
}

// grabs all notes created from the provided year, the previous and the next year
// if no year is provided, uses the current year
async function loadNotes(year?: number) {
  if (year == undefined) year = new Date().getFullYear();
  const currentYear = year;
  const lastYear = (currentYear == 1) ? -1 : currentYear - 1;
  const nextYear = (currentYear == -1) ? 1 : currentYear + 1;
  const start = convertTimeAndDateToTimestamp(lastYear.toString() + '-01-01', '');
  const end = convertTimeAndDateToTimestamp(nextYear.toString() + '-12-31', '23:59');
  try {
    // clear list before reloading
    notes.value = [];
    const rows = await readNotesInRange(start, end);
    // convert each note in range from response to UI note format
    for (const note of rows) {
      await mapDBToUINote(note, true);
    }
    // sort notes alphabetically by title for tree
    notes.value.sort((a, b) => {
      return String(a.temporaryTitle ?? a.title ?? '').toLowerCase().localeCompare(String(b.temporaryTitle ?? b.title ?? '').toLowerCase());
    });
  } catch (error) {
    console.error('Error loading notes:', error);
  }
}

onMounted(async () => {
  // Add root folder if no folders exist on page load
  await addRootFolder();
  // Ensure folders array is populated from local DB on page load
  folders.value = mapDBToUIFolder(await readAllFolders());
  // Load all reminders and notes so tree shows every item
  await loadReminders();
  await loadNotes();
  // Load reminders for selected calendar date on startup for tab list
  await loadRemindersForCalendarDate(selectedDate.value);
  // Load reminders for the visible month for calendar events
  await loadRemindersForMonth(selectedDate.value);
  // Since sync initiates on startup, set cloud toggle to on
  isCloudOn.value = true;
  // Start initial sync on app load
  await onToggleCloudSync();
  });

// Function to add a folder to the tree
function addFolder() {
   // create a UI-only draft folder with a temporary negative bigint ID
  const tempID = tempIDCounter--;
  // Sets parentFolderID of new folder to currently selected folder in file explorer tree. If no folder is selected, add new folder to root (parentFolderID = 0)
  const newParentFolderID = normalizeFolderID(selectedFolderID.value, notes.value, reminders.value, folders.value) ?? 0n;

  const draft: UIFolder = {
    folderID: tempID,
    parentFolderID: newParentFolderID,
    folderName: 'New Folder',
    folderNameError: '',
    temporaryFolderName: 'New Folder',
    isSaved: false,
    isEditing: true, // When new draft is added, automatically in editing mode to name it
    colorCode: -1
  } as UIFolder;

  
  // Add draft folder to folders array for UI rendering
  folders.value.push(draft);
  // Select newly added folder
  selectedFolderID.value = tempID;
}

// Function to save folder after user hits enter
async function saveFolder(folder: UIFolder){
  // If folder name (with whitespace removed) is empty, show error message and disable save button
  if (!folder.temporaryFolderName.trim()) {
    folder.folderNameError = 'Folder name cannot be empty.';
    return;
  }

  try {
    // First time is a draft folder, create new folder in local DB
    if (!folder.isSaved) {
      const newParentFolderID = normalizeFolderID(folder.parentFolderID ?? selectedFolderID.value, notes.value, reminders.value, folders.value) ?? 0n;
      const folderID: bigint = await createFolder(newParentFolderID, -1, folder.temporaryFolderName);
      folders.value = mapDBToUIFolder(await readAllFolders());
      selectedFolderID.value = folderID;
    }
    // Anytime afterwards, update preexisting folder
    else {
      await updateFolder(folder.folderID, folder.parentFolderID, -1, folder.temporaryFolderName);
      folders.value = mapDBToUIFolder(await readAllFolders());
    }
  }
  catch (error) {
    console.error('Error adding folder:', error);
  }
}


// Function to save note fields when save button is clicked
async function saveNote(note: UINote){
  // If note title (with whitespace removed) is empty, show error message and disable save button
    if (!note.temporaryTitle.trim()) {
    note.titleMessageError = 'Note title cannot be empty.';
    return;
  }
   // Title field can be no greater than 48 characters
  if (note.temporaryTitle.length > 48) {
    note.titleMessageError = 'Note title cannot exceed 48 characters.';
    return;
  }
   // Folder must exist 
   // Checks if folder id (temporary folder) matches any existing folder ids in folders array
  if (note.temporaryFolderID == null || !folders.value.some(folder => String(folder.folderID) === String(note.temporaryFolderID))) {
    note.folderMessageError = 'Note must be in a existing folder';
    return;
  }

 try {
  if (!note.isSaved) {
    const itemID = await createNote(note.temporaryFolderID, note.temporaryTitle, note.temporaryText);
    console.log('Note successfully created:', itemID);

    // Give this new note the actual itemID assigned by the DB and mark it saved so future saves go to update
    note.itemID = itemID;

    // Map DB row into UI and update notes.value array
    const row = await readNote(note.itemID); 
    if (row) {
      mapDBToUINote(row, true);
    } 
    // Refresh folders to show newly added note in file explorer tree
    folders.value = mapDBToUIFolder(await readAllFolders());
    // Reload notes to include newly added note
    await loadNotes();
  }
  else {
      await updateNote(note.itemID, note.temporaryFolderID, note.temporaryTitle, note.temporaryText);
      console.log('Note successfully updated:', note.itemID);

      // Map DB row into UI and update notes.value array
      const row = await readNote(note.itemID); 
      if (row) {
        mapDBToUINote(row, true);
      } 

      // Reload folders to see updated note in file tree
      folders.value = mapDBToUIFolder(await readAllFolders());
      // Reload notes to see updated note card
      await loadNotes();
  }
 } catch (error) {
    console.error('Error saving note:', error);
  }
}

// Function to save reminder fields when save button is clicked
async function saveReminder(reminder: UIReminder){
  // If reminder title (with whitespace removed) is empty, show error message and disable save button
  if (!reminder.temporaryTitle.trim()) {
    reminder.titleMessageError = 'Reminder title cannot be empty.';
    return;
  }
  // Title field can be no greater than 48 characters
  if (reminder.temporaryTitle.length > 48) {
    reminder.titleMessageError = 'Reminder title cannot exceed 48 characters.';
    return;
  }
  // eventType must be integer value 
  if (typeof reminder.eventType !== 'number' || !Number.isInteger(reminder.eventType)) {
    reminder.titleMessageError = 'Invalid event type selected.';
    return;
  }

  // Folder must exist
  // Checks if folder id (temporary folder) matches any existing folder ids in folders array
  if (reminder.temporaryFolderID == null || !folders.value.some(folder => String(folder.folderID) === String(reminder.temporaryFolderID))) {
    reminder.folderMessageError = 'Reminder must be in a existing folder';
    return;
  }

  // Check that event start time is before event end time and vice versa for all event types
    const startTime = reminder.temporaryEventStartTime;
    const endTime = reminder.temporaryEventEndTime;
    // If start & end time are valid and start time is after end time, show error message and disable save button
    if (startTime && endTime && startTime >= endTime) {
      reminder.timeMessageError = 'Start time must be before end time.';
      return;
    }
  
  // Cast times into strings (since extension fields can be multiple types)
  const startTimeStr = String(reminder.temporaryEventStartTime ?? '');
  const endTimeStr = String(reminder.temporaryEventEndTime ?? '');

  const eventStartTime = convertTimeAndDateToTimestamp(reminder.date, startTimeStr);
  const eventEndTime = convertTimeAndDateToTimestamp(reminder.date, endTimeStr);
  // If no notification time selected (never), return null. Otherwise, convert time into timestamp
  const notifTime = reminder.temporaryNotificationTime == null ? null : convertNotificationTimestamp(reminder.date, startTimeStr, reminder.temporaryNotificationTime);
  // Toggle hasNotif based on whether notification time is selected or not. If notifTime is null, hasNotif is false since theres no notification
  const hasNotification = notifTime != null;
  // Send placeholder timestamp (event start time) to backend if never notification/null for safety since backend expects a timestamp
  // Backend should ignore notifTime if hasNotif is false (theres no notification)
  const notificationTimestampToSend = notifTime ?? eventStartTime;
  const notifToDisplay = timestampToTimeString(notificationTimestampToSend);

try {
  // Reminder is not yet saved (first time saving after clicking add), create reminder in DB
  if (!reminder.isSaved) {
  // Create base reminder in local DB and retrieve the itemID assigned to it
  const itemID = await createReminder(reminder.temporaryFolderID, reminder.eventType, eventStartTime, eventEndTime, notificationTimestampToSend, hasNotification, reminder.temporaryTitle);
  console.log('Reminder successfully created:', itemID);

  // Fetch the newly created reminder from the DB 
  const row = await readReminder(itemID);

  // Map DB row into UI and update reminders.value array
  if (row) {
    mapDBToUIReminder(row, true);
  }

  folders.value = mapDBToUIFolder(await readAllFolders());
  await loadRemindersForCalendarDate(selectedDate.value);

  // Reload calendar month to include newly added reminder
  await loadRemindersForMonth(selectedDate.value);
  }
  // Reminder is saved, just updating a preexisting reminder
  else {
      await updateReminder(reminder.itemID, reminder.temporaryFolderID, reminder.eventType, eventStartTime, eventEndTime, notificationTimestampToSend, hasNotification, reminder.temporaryTitle);
      console.log('Reminder updated successfully in DB.');

      // Fetch the newly created reminder from the DB 
      const row = await readReminder(reminder.itemID);

      // Map DB row into UI and update reminders.value array
      if (row) {
        mapDBToUIReminder(row, true);
      }

      // Refresh folders to show newly added reminder in file explorer tree
      folders.value = mapDBToUIFolder(await readAllFolders());
      // Reload reminders for selected calendar date to include newly added reminder
      await loadRemindersForCalendarDate(selectedDate.value);
      // Reload calendar month to include updated reminder
      await loadRemindersForMonth(selectedDate.value);
  }
  } catch (error) {
    console.error('Error adding reminder:', error);
  }
}

// Function to delete selected individual checkbox reminders
async function deleteReminder(reminder: UIReminder) {
  try {
    // Delete specific reminder from local DB
    await deleteItem(reminder.itemID, 12);
    // Update reminders array to filter out deleted reminder
    // Array only contains reminders where the itemID does not match the deleted reminder's itemID
    reminders.value = reminders.value.filter(r => r.itemID !== reminder.itemID);
    console.log('Reminder deleted successfully from DB.');
    // Refresh folders for tree to remove deleted reminder
    folders.value = mapDBToUIFolder(await readAllFolders());
    // Reload reminders for calendar date after deleted reminder
    await loadRemindersForCalendarDate(selectedDate.value);
    // Reload calendar month to include updated reminder
    await loadRemindersForMonth(selectedDate.value);

  } catch (error) {
    console.error('Error deleting reminder from DB:', error);
  }
  // Remove reminders that have checkbox selected from reminders array
  // Creates new filtered array to render that only includes reminders that are not selected
  //reminders.value = reminders.value.filter(reminder => !reminder.isSelected);
}

// Function to delete selected individual checkbox notes
async function deleteNote(note: UINote) {
  try {
    // Delete specific note from local DB
    await deleteItem(note.itemID, 11);
    // Update notes array to filter out deleted note
    // Array only contains notes where the itemID does not match the deleted note's itemID
    notes.value = notes.value.filter(n => n.itemID !== note.itemID);
    console.log('Note deleted successfully from DB.');
    // Refresh folders for tree to remove deleted note
    folders.value = mapDBToUIFolder(await readAllFolders());
    // Re-load notes after deleted note
    await loadNotes();
  } catch (error) {
    console.error('Error deleting note from DB:', error);
  }
  // Remove notes that have checkbox selected from notes array
  // Creates new filtered array to render that only includes notes that are not selected
  // notes.value = notes.value.filter(note => !note.isSelected);
}

// Function to delete a folder or note/reminder from tree and DB
async function deleteTreeNode() {
  const selectedNode = selectedFolderID.value;
  // No tree node is selected, return
  if (selectedNode == null) {
    return;
  }

  // Tree node has a positive ID, a folder is selected
  if (selectedNode >= 0n) {
    // Find folder from folders array that matches currently selected tree node
    const folderToDelete = folders.value.find(folder => String(folder.folderID) === String(selectedNode));
    if (!folderToDelete) {
      return;
    }
        try {
          await deleteFolder(folderToDelete.folderID);
          folders.value = mapDBToUIFolder(await readAllFolders());
          await loadRemindersForCalendarDate(selectedDate.value);
          await loadNotes();
          // Clear tree node selection after deletion
          selectedFolderID.value = null;
        } catch (error) {
          console.error('Error deleting folder from DB:', error);
        }
        return;
    }

  // Tree node has a negative ID, a note or reminder is selected
  if (selectedNode < 0n) {
    const itemID = -selectedNode;

    // Find note from notes array that matches currently selected tree node
    const noteToDelete = notes.value.find(note => String(note.itemID) === String(itemID));
    if (noteToDelete) {
      try {
        // Delete specific selected note from DB and refresh UI
        await deleteItem(noteToDelete.itemID, 11);
        // Remove deleted note from notes array for UI rendering
        notes.value = notes.value.filter(note => String(note.itemID) !== String(noteToDelete.itemID));
        folders.value = mapDBToUIFolder(await readAllFolders());
        await loadNotes();
        // Clear tree node selection after deletion
        selectedFolderID.value = null;
      } catch (error) {
        console.error('Error deleting note from DB:', error);
      }
      return;
    }

    // Find reminder from reminders array that matches currently selected tree node
    const reminderToDelete = reminders.value.find(reminder => String(reminder.itemID) === String(itemID));
    if (reminderToDelete) {
      try {
        // Delete specific selected reminder from DB and refresh UI
        await deleteItem(reminderToDelete.itemID, 12);
        // Remove deleted reminder from reminders array for UI rendering
        reminders.value = reminders.value.filter(reminder => String(reminder.itemID) !== String(reminderToDelete.itemID));
        folders.value = mapDBToUIFolder(await readAllFolders());
        await loadRemindersForCalendarDate(selectedDate.value);
        // Clear tree node selection after deletion
        selectedFolderID.value = null;
      } catch (error) {
        console.error('Error deleting reminder from DB:', error);
      }
      return;
    }
  }
}

// Toggles behavior of add button. If on reminder tab, add a reminder to array. If on notes tab, add a note to array.
async function addArrayItem() {
  if (tab.value === 'reminders') {
    addReminder();
  } else if (tab.value === 'notes') {
    addNote();
  }
}

// Toggles behavior of delete button. If on reminder tab, delete selected reminders from array. If on notes tab, delete selected notes from array.
async function deleteArrayItem() {
  if (tab.value === 'reminders') {
    // Delete all selected reminders by calling deleteReminder for each selected item
    const selectedReminders = reminders.value.filter(reminder => reminder.isSelected);
    for (const reminder of selectedReminders) {
      await deleteReminder(reminder);
    }
  } else if (tab.value === 'notes') {
    // Delete all selected notes by calling deleteNote for each selected item
    const selectedNotes = notes.value.filter(note => note.isSelected);
    for (const note of selectedNotes) {
      await deleteNote(note);
    }
  }
}

// Reverts fields back to stored values from DB for a reminder when cancel button is clicked or remove draft
async function cancelReminder(reminder: UIReminder) {
  // Reminder is a draft, remove from list
  if (!reminder.isSaved) {
    reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));
    // Reload list for selected calendar date
    await loadRemindersForCalendarDate(selectedDate.value);
  // Reminder is saved, revert temporary fields back to saved database values
  } else {
    const row = await readReminder(reminder.itemID); 
    if (row) {
      mapDBToUIReminder(row, true);
    } 
  }
}

// Reverts fields back to stored values from DB for a note when cancel button is clicked or remove draft
async function cancelNote(note: UINote) {
  // Note is a draft, remove from list
  if (!note.isSaved) {
    notes.value = notes.value.filter(n => String(n.itemID) !== String(note.itemID));
    // Reload note list
    await loadNotes();
  // Note is saved, revert temporary fields back to saved database values
  } else {
    // Reload DB row of note and restore fields
    const row = await readNote(note.itemID);
    if (row) {
      mapDBToUINote(row, true);
    }
  }
}

// Watcher on the checkbox to select and deselect all reminders or notes when select all checkbox is toggled
watch(selectAll, (selectionVal) => {
  if (tab.value === 'reminders') {
    filteredReminders.value.forEach(reminder => {
      reminder.isSelected = selectionVal;
    });
  } else if (tab.value === 'notes') {
    notes.value.forEach(note => {
      note.isSelected = selectionVal;
    });
  }
});

// Watch event type of each reminder
reminders.value.forEach(reminder => {
  // Clear error message when switching event types to not confuse users with old fields
  watch(() => reminder.eventType, () => {
    reminder.timeMessageError = '';
  });
});

// template and script source code from slot - day month example
// https://qcalendar.netlify.app/developing/qcalendar-month
const calendar = ref<QCalendarMonth>(),
  selectedDate = ref(today()),
  selectedYear = ref(new Date().getFullYear()),
  locale = ref('en-US')

const formattedMonth = computed(() => {
  const date = new Date(selectedDate.value)
  const formatter = monthFormatter()
  return formatter ? formatter.format(date) : ''
})

// Filtered reminder array for displaying only reminders that match the selected calendar date or search query
const filteredReminders = computed(() => {
  //return reminders.value.filter(reminder => reminder.date === selectedDate.value)
  // Normalize search query: remove whitespace and convert to lowercase for case-insensitive matching
  // Search functionality example: https://stackoverflow.com/questions/74670957/how-to-display-search-results-using-react-typescript
  const query = (searchQuery.value ?? '').trim().toLowerCase();
  if (!searchQuery.value) {
    // If no search query, default show reminders for selected calendar date
    return reminders.value.filter(reminder => reminder.date === selectedDate.value);
  }

  // Otherwise, filter reminders based on the search query (title)
  return reminders.value.filter(reminder => {
    // Check for reminders entries where the title is in the search query
    const matchesQuery = String(reminder.temporaryTitle ?? '').toLowerCase().includes(query) || String(reminder.title ?? '').toLowerCase().includes(query);
    // Return true if both date and query match
    return matchesQuery;
  });
});

// Reload list of reminders whenever the selected calendar date changes
watch(selectedDate, async (newDate) => {
  // Load reminders for newly selected calendar date
  await loadRemindersForCalendarDate(newDate);
});

// Create events on calendar from reminders
const events = computed(() => buildCalendarEvents(monthReminders.value, eventTypes))
// Group events by date
const eventsMap = computed(() => groupEventsByDate(events.value))

// If user clicks calendar event, route to that reminder entry
function onClickCalendarEvent(event: CalendarEvent) {
  // Find reminder that matches event
  const reminder = reminders.value.find(reminder => String(reminder.itemID) === String(event.id));
  if (!reminder) {
    return;
  } 
  tab.value = 'reminders';
  selectedDate.value = reminder.date;
  reminders.value.forEach(reminder => { reminder.expanded = false; })
  reminder.expanded = true;
}

// Filtered notes array for displaying only notes that match the search query
const filteredNotes = computed(() => {
  // Normalize search query: remove whitespace and convert to lowercase for case-insensitive matching
  // Search functionality example: https://stackoverflow.com/questions/74670957/how-to-display-search-results-using-react-typescript
  const query = (searchQuery.value ?? '').trim().toLowerCase();
  if (!searchQuery.value) {
    // If no search query, default show all the notes
    return notes.value;
  }

  // Otherwise, filter notes based on the search query (title)
  return notes.value.filter(note => {
    // Check for note entries where the title is in the search query
    const matchesQuery = String(note.temporaryTitle ?? '').toLowerCase().includes(query) || String(note.title ?? '').toLowerCase().includes(query);
    return matchesQuery;
  });
  });


// Watcher to unselect the select all checkbox if there are no reminders or notes in the array (ex. none made or after deletion)
watch([filteredReminders, notes, tab], () => {
  if (tab.value == 'reminders' && filteredReminders.value.length === 0) {
    selectAll.value = false;
  }
  if (tab.value === 'notes' && notes.value.length === 0) {
    selectAll.value = false;
  }
});

// Watcher on cloud sync toggle to reset message when changed
watch(isCloudOn, (enabled) => {
  if (!enabled) {
    syncStatusMessage.value = 'Cloud Sync Disabled';
  }
});

function monthFormatter() {
  try {
    return new Intl.DateTimeFormat(locale.value || undefined, {
      month: 'long',
      timeZone: 'UTC',
    })
  } catch {
    //
  }
}

function addToYear(amount: number) {
  // parse current date to timestamp
  let ts = parseTimestamp(selectedDate.value)
  if (ts) {
    // add specified amount of days
    ts = addToDate(ts, { year: amount })
    // re-assign values
    selectedDate.value = ts.date
    selectedYear.value = ts.year
  }
}

function onToday() {
  if (calendar.value) {
    calendar.value.moveToToday()
  }
}

function onPrev() {
  if (calendar.value) {
    calendar.value.prev()
  }
}
function onNext() {
  if (calendar.value) {
    calendar.value.next()
  }
}

// Show reminders for current calendar month
async function onMoved(data: Timestamp) {
  console.log('qcalendar onMoved payload:', data);
  await loadRemindersForMonth(selectedDate.value);
}
async function onChange(data: Timestamp) {
  console.log('qcalendar onChange payload:', data);
  await loadRemindersForMonth(selectedDate.value);
}

function onClickDate(data: Timestamp) {
  console.info('onClickDate', data)
}
function onClickDay(data: Timestamp) {
  console.info('onClickDay', data)
}
function onClickWorkweek(data: Timestamp) {
  console.info('onClickWorkweek', data)
}
function onClickHeadDay(data: Timestamp) {
  console.info('onClickHeadDay', data)
}
function onClickHeadWorkweek(data: Timestamp) {
  console.info('onClickHeadWorkweek', data)
}

</script>