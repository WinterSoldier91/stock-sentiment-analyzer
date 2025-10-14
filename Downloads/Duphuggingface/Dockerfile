FROM python:3.10

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

RUN python -m nltk.downloader vader_lexicon

COPY . /code

CMD ["streamlit", "run", "app.py", "--server.port=7860", "--server.address=0.0.0.0"]
