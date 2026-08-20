import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import CadastroUsuarios from "./pages/CadastroUsuarios";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<CadastroUsuarios />} />
    </Routes>
  );
}

export default App;