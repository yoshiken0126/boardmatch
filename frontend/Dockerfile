FROM node:20.12.1
RUN mkdir /frontend
COPY ./ /frontend
WORKDIR /frontend 
RUN yarn global add create-next-app@14 
RUN yarn global add axios
RUN yarn global add shadcn
RUN yarn global add date-fns

#RUN yarn build
CMD ["yarn", "run"]