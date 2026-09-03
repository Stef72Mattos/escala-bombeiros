import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CadastroUsuarios from "./pages/CadastroUsuarios";
import ListaUsuarios from "./pages/ListaUsuarios";
import CadastroBombeiros from "./pages/CadastroBombeiros";
import EscalaMensal from "./pages/EscalaMensal";
import ListaBombeiros from "./pages/ListaBombeiros";
import CadastroAtestados from "./pages/CadastroAtestados";
import CadastroFerias from "./pages/CadastroFerias";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/cadastro" element={<CadastroUsuarios />} />
      <Route path="/usuarios" element={<ListaUsuarios />} />
      <Route path="/bombeiros" element={<CadastroBombeiros />}/>
      <Route path="/escala" element={<EscalaMensal />}/>
      <Route path="/lista-bombeiros" element={<ListaBombeiros />}/>
      <Route path="/atestados" element={<CadastroAtestados />}/>
      <Route path="/ferias" element={<CadastroFerias />}/>
    </Routes>
  );
}

export default App;
