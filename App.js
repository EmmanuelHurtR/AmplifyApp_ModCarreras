import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  Button,
  Alert,
} from "react-native";
import { API, graphqlOperation } from "aws-amplify";
import { createTodo, updateTodo, deleteTodo } from "./src/graphql/mutations";
import { listTodos } from "./src/graphql/queries";
import {
  withAuthenticator,
  useAuthenticator,
} from "@aws-amplify/ui-react-native";

import { Amplify } from "aws-amplify";
import awsExports from "./src/aws-exports";
Amplify.configure(awsExports);

const userSelector = (context) => [context.user];

const SignOutButton = () => {
  const { user, signOut } = useAuthenticator(userSelector);
  return (
    <Pressable onPress={signOut} style={styles.buttonContainer}>
      <Text style={styles.buttonText}>Back to Login</Text>
    </Pressable>
  );
};

const initialFormState = {
  id: "",
  nombre: "",
  siglas: "",
  nivel: "",
  objetivo: "",
  perfilI: "",
  perfilE: "",
  estatus: "",
};

const App = () => {
  const [formState, setFormState] = useState(initialFormState);
  const [todos, setTodos] = useState([]);
  const [selectedTodoIndex, setSelectedTodoIndex] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  useEffect(() => {
    fetchTodos();
  }, []);

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos));
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log("error fetching todos");
    }
  }

  async function addTodo() {
    try {
      if (
        !formState.id ||
        !formState.nombre ||
        !formState.siglas ||
        !formState.nivel ||
        !formState.objetivo ||
        !formState.perfilI ||
        !formState.perfilE ||
        !formState.estatus
      ) {
        Alert.alert(
          "Error",
          "Para agregar una carrera debes llenar todos los campos"
        );
        return;
      }

      if (editMode) {
        await updateTodoItem();
      } else {
        const todo = { ...formState };
        setTodos([...todos, todo]);
        setFormState(initialFormState);
        await API.graphql(graphqlOperation(createTodo, { input: todo }));
      }
    } catch (err) {
      console.log("error creating/updating todo:", err);
    } finally {
      setEditMode(false);
    }
  }

  async function updateTodoItem() {
    const todoToUpdate = todos[selectedTodoIndex];
    const updatedTodo = { ...todoToUpdate, ...formState };
    setTodos((prevTodos) => {
      const updatedTodos = [...prevTodos];
      updatedTodos[selectedTodoIndex] = updatedTodo;
      return updatedTodos;
    });
    await API.graphql(graphqlOperation(updateTodo, { input: updatedTodo }));
  }

  async function deleteTodoItem() {
    try {
      if (!deleteId) {
        Alert.alert("Error", "Ingresa el ID del objeto a eliminar");
        return;
      }

      await API.graphql(graphqlOperation(deleteTodo, { input: { id: deleteId } }));

      setTodos(todos.filter(todo => todo.id !== deleteId));
      setDeleteId("");
    } catch (err) {
      console.log("error deleting todo:", err);
    }
  }

  function startEditTodo(index) {
    const selectedTodo = todos[index];
    setFormState(selectedTodo);
    setSelectedTodoIndex(index);
    setEditMode(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <SignOutButton />
        <Text style={styles.title}>Agregar Carrera</Text>
        <TextInput
          onChangeText={(value) => setInput("id", value)}
          style={styles.input}
          value={formState.id}
          placeholder="id"
        />
        <TextInput
          onChangeText={(value) => setInput("nombre", value)}
          style={styles.input}
          value={formState.nombre}
          placeholder="Nombre"
        />
        <TextInput
          onChangeText={(value) => setInput("siglas", value)}
          style={styles.input}
          value={formState.siglas}
          placeholder="Siglas"
        />
        <TextInput
          onChangeText={(value) => setInput("nivel", value)}
          style={styles.input}
          value={formState.nivel}
          placeholder="Nivel"
        />
        <TextInput
          onChangeText={(value) => setInput("objetivo", value)}
          style={styles.input}
          value={formState.objetivo}
          placeholder="Objetivo"
        />
        <TextInput
          onChangeText={(value) => setInput("perfilI", value)}
          style={styles.input}
          value={formState.perfilI}
          placeholder="Perfil de Ingreso"
        />
        <TextInput
          onChangeText={(value) => setInput("perfilE", value)}
          style={styles.input}
          value={formState.perfilE}
          placeholder="Perfil de Egreso"
        />
        <TextInput
          onChangeText={(value) => setInput("estatus", value)}
          style={styles.input}
          value={formState.estatus}
          placeholder="Estatus"
        />
        <Pressable onPress={addTodo} style={styles.buttonContainer}>
          <Text style={styles.buttonText}>
            {editMode ? "Actualizar Carrera" : "Añadir Carrera"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFormState(initialFormState)}
          style={styles.buttonContainer}
        >
          <Text style={styles.buttonText}>Limpiar</Text>
        </Pressable>
        <Text style={styles.subtitle}>Lista de Carreras</Text>
        <ScrollView>
          {todos.map((todo, index) => (
            <View key={todo.id ? todo.id : index} style={styles.todo}>
              <Pressable
                onPress={() =>
                  setSelectedTodoIndex(
                    selectedTodoIndex === index ? null : index
                  )
                }
              >
                <Text style={styles.todoNombre}>{todo.nombre}</Text>
              </Pressable>
              {selectedTodoIndex === index ? (
                <View>
                  <Text>ID: {todo.id}</Text>
                  <Text>Siglas: {todo.siglas}</Text>
                  <Text>Nivel: {todo.nivel}</Text>
                  <Text>Objetivo: {todo.objetivo}</Text>
                  <Text>Perfil de Ingreso: {todo.perfilI}</Text>
                  <Text>Perfil de Egreso: {todo.perfilE}</Text>
                  <Text>Estatus: {todo.estatus}</Text>
                  <Pressable
                    onPress={() => startEditTodo(index)}
                    style={styles.buttonContainer}
                  >
                    <Text style={styles.buttonText}>Editar Carrera</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDeleteId(todo.id)}
                    style={styles.buttonContainer}
                  >
                    <Text style={styles.buttonText}>Eliminar Carrera</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default withAuthenticator(App);

const styles = StyleSheet.create({
  container: {
    width: 400,
    flex: 1,
    padding: 20,
    alignSelf: "center",
  },
  todo: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ddd",
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoNombre: {
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonContainer: {
    alignSelf: "center",
    backgroundColor: "black",
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    padding: 16,
    fontSize: 18,
  },
});
