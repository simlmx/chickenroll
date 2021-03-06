# See https://github.com/mars/create-react-app-buildpack/issues/161#issuecomment-535273225
TEMPLATE_STR='{{DYNAMIC_PUBLIC_URL}}'
if [ -f "build/index.html" ]; then
  echo "Injecting 'DYNAMIC_PUBLIC_URL' value '$DYNAMIC_PUBLIC_URL' into build/index.html by replacing the text '$TEMPLATE_STR' (from .profile)"
  sed -iE "s,$TEMPLATE_STR,$DYNAMIC_PUBLIC_URL,g" build/index.html
fi
