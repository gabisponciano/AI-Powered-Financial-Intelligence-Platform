def normalize_dataframe(df):
    df.columns = df.columns.str.lower()

    mapping = {
        "valor": "amount",
        "data": "date",
        "cliente": "customer",
        "descricao": "description"
    }

    df = df.rename(columns=mapping)

    return df