import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { auth, db } from '@/config/firebase';
import { DB } from '@/constants/db';
import type { TaskItem } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from "@aptabase/react-native";

export async function getTasks(): Promise<TaskItem[]> {
  const queryRef = query(collection(db, DB.TASKS), where('userId', '==', auth.currentUser.uid));

  const querySnapshot = await getDocs(queryRef);
  const list = querySnapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      }) as TaskItem,
  );

  return list;
}

export async function createTask(task: TaskItem): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, DB.TASKS), {
      ...task,
      parentId: task.parentId || null,
      userId: auth.currentUser.uid,
    });
    // return id of created task
    return docRef.id;
  } catch (error) {
    console.error(error.message);
  }
}

export async function updateTask(task: Omit<TaskItem, 'subTasks'>): Promise<void> {
  await updateDoc(doc(db, DB.TASKS, task.id), task);
}

export async function deleteTasks(tasks: TaskItem[]): Promise<void> {
  const batch = writeBatch(db);
  for (const task of tasks) {
    // delete storage key
    AsyncStorage.removeItem(task.id);
    const tasksRef = doc(db, DB.TASKS, task.id);
    batch.delete(tasksRef);
  }
  await batch.commit();
}

export async function updateTasksCompleted(tasks: TaskItem[]): Promise<void> {
  const batch = writeBatch(db);
  for (const task of tasks) {
    const tasksRef = doc(db, DB.TASKS, task.id);
    batch.update(tasksRef, { completed: task.completed });
    // console.log(task)
    var current_date = Date.now().toString();
    if (task.completed === true) {
      if (task.parentId === null) {
        var cur_id = task.id
        await trackEvent("complete task", {cur_id, finish_date: current_date });
      } else {
        var cur_id = task.id
        await trackEvent("complete sub task", {cur_id, finish_date: current_date });
      }
    }
    
    // 
  }
  await batch.commit();
}
