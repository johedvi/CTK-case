@echo OFF
(npx tsc
@echo ON
npx jsdoc ./router ./model ./service ./db -d %~dp0/DOCS
@echo OFF
cd %~dp0/router && del *.js*
cd %~dp0/service && del *.js*
cd %~dp0/model && del *.js*
cd %~dp0/tests && del *.js*
cd %~dp0
)