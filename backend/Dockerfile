FROM python:3.10.7
ENV PYTHONONUNBUFFERED 1
RUN mkdir /backend
COPY ./ /backend
WORKDIR /backend
ADD requirements.txt /backend/
RUN pip install -r requirements.txt
#RUN python manage.py makemigrations
#RUN python manage.py migrate
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]