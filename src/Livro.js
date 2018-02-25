import React, { Component } from 'react';
import $ from 'jquery';
import InputCustomizado from './componentes/InputCustomizado';
import BotaoSubmitCustomizado from './componentes/BotaoSubmitCustomizado';
import PubSub from 'pubsub-js';
import TratadorErros from './TratadorErros';

export class FormularioLivros extends Component {

    constructor() {
        super();
        this.state = { titulo: '', preco: '', autorId: '' };
        this.enviarForm = this.enviarForm.bind(this);
        this.setTitulo = this.setTitulo.bind(this);
        this.setPreco = this.setPreco.bind(this);
        this.setAutorId = this.setAutorId.bind(this);
    }

    setTitulo(evento) {
        this.setState({ titulo: evento.target.value });
    }

    setPreco(evento) {
        this.setState({ preco: evento.target.value });
    }

    setAutorId(evento) {
        this.setState({ autorId: evento.target.value });
    }

    enviarForm(evento) {
        evento.preventDefault();

        $.ajax({
            url: "http://localhost:8080/api/livros",
            contentType: 'application/json',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify({ titulo: this.state.titulo, preco: this.state.preco, autorId: this.state.autorId }),
            success: function (novaListagem) {
                PubSub.publish('atualiza-lista-livros', novaListagem);
                this.setState({ titulo: '', preco: '', autorId: '' });
            }.bind(this),
            error: function (resposta) {
                if (resposta.status === 400) {
                    new TratadorErros().publicaErros(resposta.responseJSON);
                }
            },
            beforeSend: function () {
                PubSub.publish("limpa-erros", {});
            }
        });
    }

    render() {
        return (
            <div className="pure-form pure-form-aligned">
                <div className="content" id="content">
                    <form className="pure-form pure-form-aligned" onSubmit={this.enviarForm} method="post">
                        <InputCustomizado id="titulo" type="text" name="titulo" value={this.state.titulo} onChange={this.setTitulo} label="Titulo" />
                        <InputCustomizado id="preco" type="text" name="preco" value={this.state.preco} onChange={this.setPreco} label="Preco" />
                        <div className="pure-control-group">
                            <label htmlFor="autorId">Autor</label>
                            <select value={this.state.autorId} id="autorID" name="autorId" onChange={this.setAutorId}>
                                <option value="">Selecione o autor</option>
                                {
                                    this.props.autores.map(function (autor) {
                                        return <option key={autor.id} value={autor.id}>{autor.nome}</option>
                                    })
                                }
                            </select>
                        </div>
                        <BotaoSubmitCustomizado label="Gravar" />
                    </form>
                </div>
            </div>
        );
    }
}

export class TabelaLivros extends Component {

    render() {
        return (
            <div>
                <table className="pure-table">
                    <thead>
                        <tr>
                            <th>Titulo</th>
                            <th>Preço</th>
                            <th>Autor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.props.lista.map(function (livro) {
                                return (
                                    <tr key={livro.id}>
                                        <td>{livro.titulo}</td>
                                        <td>{livro.preco}</td>
                                        <td>{livro.autor.nome}</td>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            </div>
        );
    }
}

export class LivroBox extends Component {

    constructor() {
        super();
        this.state = { lista: [], autores: [] };
    }

    componentDidMount() {
        $.ajax({
            url: "http://localhost:8080/api/livros",
            dataType: 'json',
            success: function (resposta) {
                this.setState({ lista: resposta });
            }.bind(this)
        }
        );

        $.ajax({
            url: "http://localhost:8080/api/autores",
            dataType: 'json',
            success: function (resposta) {
                this.setState({ autores: resposta });
            }.bind(this)
        }
        );

        PubSub.subscribe('atualiza-lista-livros', function (topico, novaLista) {
            this.setState({ lista: novaLista });
        }.bind(this));
    }

    render() {
        return (
            <div>
                <div className="header">
                    <h1>Cadastro de livros</h1>
                </div>
                <div className="content" id="content">
                    <FormularioLivros autores={this.state.autores} />
                    <TabelaLivros lista={this.state.lista} />
                </div>
            </div>
        );
    }
}