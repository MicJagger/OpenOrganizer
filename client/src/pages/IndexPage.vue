<template>
  <q-page class="row items-center justify-evenly">
    <example-component
      title="Example component"
      active
      :todos="todos"
      :meta="meta"
    ></example-component>
    <section class="column items-center q-gutter-xl">
      <div class="test-pieces">
        <button @click="() => handleCommand('not setup', 'in0', 'out0')">Local</button>
        <input id="in0" type="text" />
      </div>
      <section id="out0"></section>
      <div class="test-pieces">
        <button @click="() => handleSqliteCommand('sqliteRead', 'in1', 'out1')">DB Read</button>
        <input id="in1" type="text" />
      </div>
      (sqlite) ex: "k=foo"
      <section id="out1"></section>
      <div class="test-pieces">
        <button @click="() => handleSqliteCommand('sqliteCreate', 'in2', 'out2')">DB Create</button>
        <input id="in2" type="text" />
      </div>
      (sqlite) ex: "k=foo&v=bar"
      <section id="out2"></section>
      <div class="test-pieces">
        <button @click="() => handleSqliteCommand('sqliteUpdate', 'in3', 'out3')">DB Update</button>
        <input id="in3" type="text" />
      </div>
         (sqlite) ex: "k=foo&v=bar"
      <section id="out3"></section>
      <div class="test-pieces">
        <button @click="() => handleSqliteCommand('sqliteDelete', 'in4', 'out4')">DB Delete</button>
        <input id="in4" type="text" />
      </div>
      (sqlite) ex: "k=foo"
      <section id="out4"></section>
      <div class="test-pieces">
        <button @click="() => handleCommand('raw', 'in5', 'out5')">Server</button>
        <input id="in5" type="text" />
      </div>
      ex: "raw data"
      <section id="out5"></section>
      <div class="test-pieces">
        <button @click="() => handleCommand('read', 'in6', 'out6')">DB Read</button>
        <input id="in6" type="text" />
      </div>
      (postgres) ex: "k=foo"
      <section id="out6"></section>
      <div class="test-pieces">
        <button @click="() => handleCommand('create', 'in7', 'out7')">DB Create</button>
        <input id="in7" type="text" />
      </div>
      (postgres) ex: "k=foo&v=bar"
      <section id="out7"></section>
       <div class="test-pieces">
        <button @click="() => handleCommand('update', 'in8', 'out8')">DB Update</button>
        <input id="in8" type="text" />
      </div>
      (postgres) ex: "k=foo&v=bar"
      <section id="out8"></section>
       <div class="test-pieces">
        <button @click="() => handleCommand('delete', 'in9', 'out9')">DB Delete</button>
        <input id="in9" type="text" />
      </div>
      (postgres) ex: "k=foo"
      <section id="out9"></section>
  </section>
  </q-page>
</template>

<script setup lang="ts">
import * as db from '../utils/db';
import ExampleComponent from 'components/ExampleComponent.vue';
import type { Meta, Todo } from 'components/models';
import { ref } from 'vue';

const todos = ref<Todo[]>([
  {
    id: 1,
    content: 'ct1'
  },
  {
    id: 2,
    content: 'ct2'
  },
  {
    id: 3,
    content: 'ct3'
  },
  {
    id: 4,
    content: 'ct4'
  },
  {
    id: 5,
    content: 'ct5'
  }
]);

const meta = ref<Meta>({
  totalCount: 1200,
});

// the way i retrieved text works, but might not be the optimal vue way to do it

async function handleCommand(mode: string, inId: string, outId: string) {
  console.log('Insert pressed');
  const input: string = (document.getElementById(inId)! as HTMLInputElement).value;
  const output = document.getElementById(outId)!;
  output.textContent = await db.dbCommand(mode, input);
}

async function handleSqliteCommand(mode: string, inId: string, outId: string) {
  const input = (document.getElementById(inId)! as HTMLInputElement).value;
  const output = document.getElementById(outId)!;
  const params = new URLSearchParams(input);

  switch (mode) {
    case 'sqliteRead': {
      const key = params.get('k');
      if (!key) return;
      const result = await window.electronAPI.sqliteRead(key);
      // Result of "Not found" will display as "Not found".
      if (result !== "Not found") output.textContent = "retrieved '"+result+"' using '"+ key +"'"
      else output.textContent = result
      break;
    }

    case 'sqliteCreate': {
      const key = params.get('k');
      const value = params.get('v');
      if (!key || value === null) return;
      const result = await window.electronAPI.sqliteCreate(key, value);
      if (result) output.textContent = "stored '"+key+"', '"+ value +"'"
      break;
    }

    case 'sqliteUpdate': {
      const key = params.get('k');
      const value = params.get('v');
      if (!key || value === null) return;
      const result = await window.electronAPI.sqliteUpdate(key, value);
      if (result) output.textContent = "updated key '"+key+"' value to '"+ value +"'"
      break;
    }

     case 'sqliteDelete': {
      const key = params.get('k');
      if (!key) return;
      const result = await window.electronAPI.sqliteDelete(key);
      if (result) output.textContent = "deleted '"+key+"'"
      break;
    }
  }
}
</script>
