<!--
 * Authors: Rachel Patella
 * Created: 2025-10-01
 * Updated: 2025-10-01
 *
 * This file is a recursive component to display the nested folder tree in the file explorer in the left column on the calendar page
 *
 * References:
 * https://michael-verschoof.medium.com/recursive-components-in-vue-3-e897643df82 for reference on how to make a recursive component and display a file system
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and 
 * license terms outlined in the LICENSE file located in the top-level directory of 
 * this distribution. No part of OpenOrganizer, including this file, may be reproduced, 
 * modified, distributed, or otherwise used except in accordance with the terms 
 * specified in the LICENSE file.
-->
<template>
  <ul class = "file-list">
    <li v-for="folder in folders" :key="folder.folderID">
      <div>
          <q-icon name="folder" color="primary" class="q-mr-sm" />
        {{ folder.folderName }}
      </div>
      <RecursiveFolderTree style="font-size: 15px"
        v-if="folder.children"
        :folders="folder.children"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
// Folder type imported from CalendarPage to define the prop type
import type { Folder } from 'src/pages/CalendarPage.vue';

const props = defineProps<{
  folders: Folder[]}>();
</script>
